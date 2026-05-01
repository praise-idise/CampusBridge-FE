import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import {
    LISTING_STATUS,
    LISTING_STATUS_LABELS,
    LISTING_STATUS_OPTIONS,
    LISTING_TYPE,
    LISTING_TYPE_LABELS,
    LISTING_TYPE_OPTIONS,
    isApiError,
    type UpdateListingRequestDTO,
} from "@/api/types";
import { useAuth } from "@/hooks/use-auth";
import { startConversation } from "@/services/chat.service";
import { createPaymentHold } from "@/services/payments.service";
import {
    downloadListingPhoto,
    getListingById,
    updateListing,
    uploadListingPhoto,
} from "@/services/listings.service";
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
    Label,
    Spinner,
    Textarea,
} from "@/components/ui";

const MAX_LISTING_PHOTOS = 3;

type PhotoPreview = {
    id: string;
    url: string;
    name: string;
};

export function ListingDetailPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { listingId } = useParams({ from: "/app/listings/$listingId" });
    const uploadInputRef = useRef<HTMLInputElement | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);
    const [pendingFilePreviews, setPendingFilePreviews] = useState<PhotoPreview[]>([]);
    const [loadedImageIds, setLoadedImageIds] = useState<string[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isPhotosLoading, setIsPhotosLoading] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<UpdateListingRequestDTO | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentNote, setPaymentNote] = useState("");

    const listingQuery = useQuery({
        queryKey: ["listing", listingId],
        queryFn: () => getListingById(listingId),
    });

    const listing = listingQuery.data?.data;
    const isOwner = listing?.ownerId === user?.userId;

    useEffect(() => {
        if (!listing || isOwner) return;
        setPaymentAmount(listing.price);
    }, [listing, isOwner]);

    // Populate edit form when listing loads
    const openEdit = () => {
        if (!listing) return;
        setEditForm({
            title: listing.title,
            description: listing.description,
            price: listing.price,
            location: listing.location ?? "",
            type: listing.type,
            status: listing.status,
        });
        setIsEditOpen(true);
    };

    useEffect(() => {
        let cancelled = false;
        const urlsToRevoke: string[] = [];

        async function loadPhotos() {
            if (!listing?.photos?.length) {
                setPhotoPreviews([]);
                setLoadedImageIds([]);
                return;
            }

            try {
                setIsPhotosLoading(true);
                setLoadedImageIds([]);
                const next = await Promise.all(
                    listing.photos.map(async (photo) => {
                        const result = await downloadListingPhoto(photo.id);
                        const url = URL.createObjectURL(result.blob);
                        urlsToRevoke.push(url);

                        return {
                            id: photo.id,
                            url,
                            name: result.filename ?? photo.fileName ?? "Listing photo",
                        };
                    }),
                );

                if (!cancelled) {
                    setPhotoPreviews(next);
                }
            } catch {
                if (!cancelled) {
                    setPhotoPreviews([]);
                }
            } finally {
                if (!cancelled) {
                    setIsPhotosLoading(false);
                }
            }
        }

        void loadPhotos();

        return () => {
            cancelled = true;
            urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [listing]);

    useEffect(() => {
        return () => {
            pendingFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [pendingFilePreviews]);

    const uploadPhotoMutation = useMutation({
        mutationFn: async (files: File[]) => {
            for (const file of files) {
                await uploadListingPhoto(listingId, file);
            }
        },
        onSuccess: () => {
            pendingFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
            setSelectedFiles([]);
            setPendingFilePreviews([]);
            if (uploadInputRef.current) {
                uploadInputRef.current.value = "";
            }
            setFeedbackMessage("Photos uploaded successfully.");
            queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
            queryClient.invalidateQueries({ queryKey: ["listings"] });
        },
        onError: (error) => {
            setFeedbackMessage(isApiError(error) ? error.message : "Failed to upload listing photos.");
        },
    });

    function removeSelectedFile(fileId: string) {
        const previewToRemove = pendingFilePreviews.find((item) => item.id === fileId);
        if (previewToRemove) {
            URL.revokeObjectURL(previewToRemove.url);
        }

        setPendingFilePreviews((prev) => prev.filter((item) => item.id !== fileId));
        setSelectedFiles((prev) => prev.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== fileId));
    }

    function clearSelectedFiles() {
        pendingFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
        setPendingFilePreviews([]);
        setSelectedFiles([]);
        if (uploadInputRef.current) {
            uploadInputRef.current.value = "";
        }
    }

    function addFiles(files: File[]) {
        if (!files.length) return;

        const existingPhotoCount = listing?.photos?.length ?? 0;
        const remainingSlots = Math.max(0, MAX_LISTING_PHOTOS - existingPhotoCount - selectedFiles.length);

        if (remainingSlots <= 0) {
            setFeedbackMessage(`Maximum ${MAX_LISTING_PHOTOS} photos allowed per listing.`);
            return;
        }

        const existingIds = new Set(selectedFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
        const uniqueFiles = files.filter((file) => !existingIds.has(`${file.name}-${file.size}-${file.lastModified}`));
        const filesToAdd = uniqueFiles.slice(0, remainingSlots);

        if (filesToAdd.length < uniqueFiles.length) {
            setFeedbackMessage(`Only ${MAX_LISTING_PHOTOS} photos are allowed per listing.`);
        } else {
            setFeedbackMessage(null);
        }

        if (!filesToAdd.length) return;

        setSelectedFiles((prev) => [...prev, ...filesToAdd]);
        setPendingFilePreviews((prev) => [
            ...prev,
            ...filesToAdd.map((file) => ({
                id: `${file.name}-${file.size}-${file.lastModified}`,
                name: file.name,
                url: URL.createObjectURL(file),
            })),
        ]);
    }

    const updateListingMutation = useMutation({
        mutationFn: (payload: UpdateListingRequestDTO) => updateListing(listingId, payload),
        onSuccess: () => {
            setIsEditOpen(false);
            setEditForm(null);
            setFeedbackMessage("Listing updated.");
            queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
            queryClient.invalidateQueries({ queryKey: ["listings-mine"] });
        },
        onError: (error) => {
            setFeedbackMessage(isApiError(error) ? error.message : "Failed to update listing.");
        },
    });

    const startConversationMutation = useMutation({
        mutationFn: () =>
            startConversation({
                targetUserId: listing?.ownerId ?? "",
                listingId,
                initialMessage: `Hi, I'm interested in \"${listing?.title ?? "this listing"}\".`,
            }),
        onSuccess: (response) => {
            if (response.data?.id) {
                sessionStorage.setItem("campusbridge:open-conversation", response.data.id);
            }
            navigate({ to: "/app/messages" });
        },
        onError: (error) => {
            setFeedbackMessage(isApiError(error) ? error.message : "Failed to start conversation.");
        },
    });

    const createPaymentMutation = useMutation({
        mutationFn: () =>
            createPaymentHold({
                listingId,
                payeeUserId: listing?.ownerId ?? "",
                amount: paymentAmount,
                note: paymentNote.trim() || undefined,
            }),
        onSuccess: () => {
            setFeedbackMessage("Escrow payment hold created. You can track it in Payments.");
            setPaymentNote("");
            queryClient.invalidateQueries({ queryKey: ["payments"] });
        },
        onError: (error) => {
            setFeedbackMessage(isApiError(error) ? error.message : "Failed to create payment hold.");
        },
    });

    function handleUploadPhotos(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (selectedFiles.length === 0) {
            setFeedbackMessage("Choose one or more photos to upload.");
            return;
        }

        uploadPhotoMutation.mutate(selectedFiles);
    }

    const createdAtLabel = useMemo(() => {
        if (!listing?.createdAt) return null;
        return new Date(listing.createdAt).toLocaleString();
    }, [listing?.createdAt]);

    if (listingQuery.isLoading) {
        return (
            <main className="space-y-4">
                <p className="text-sm text-muted-foreground">Loading listing...</p>
            </main>
        );
    }

    if (!listing) {
        return (
            <main className="space-y-4">
                <p className="text-sm text-muted-foreground">Listing not found.</p>
                <Button variant="outline" size="sm" asChild>
                    <Link to="/app/listings">Back to listings</Link>
                </Button>
            </main>
        );
    }

    return (
        <main className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/app/listings">Back to Listings</Link>
                    </Button>
                    <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge>{LISTING_TYPE_LABELS[listing.type]}</Badge>
                        {isOwner && <Badge variant="muted">Your Listing</Badge>}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-semibold">{listing.price.toFixed(2)}</p>
                    {listing.location && <p className="text-sm text-muted-foreground">{listing.location}</p>}
                    {createdAtLabel && <p className="text-xs text-muted-foreground">Posted {createdAtLabel}</p>}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                            <CardDescription>Everything the seller shared about this listing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-sm text-foreground">{listing.description}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Photos</CardTitle>
                            <CardDescription>{photoPreviews.length > 0 ? "Uploaded listing photos" : "No photos uploaded yet"}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isPhotosLoading ? (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div key={`photo-loading-${index}`} className="overflow-hidden rounded-lg border border-border bg-muted/20">
                                            <div className="flex h-52 items-center justify-center">
                                                <Spinner size="lg" className="text-muted-foreground" />
                                            </div>
                                            <div className="p-3 text-xs text-muted-foreground">Loading photo...</div>
                                        </div>
                                    ))}
                                </div>
                            ) : photoPreviews.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {photoPreviews.map((photo) => (
                                        <div key={photo.id} className="overflow-hidden rounded-lg border border-border bg-muted/20">
                                            <div className="relative h-52 w-full">
                                                {!loadedImageIds.includes(photo.id) && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                                                        <Spinner className="text-muted-foreground" />
                                                    </div>
                                                )}
                                                <img
                                                    src={photo.url}
                                                    alt={photo.name}
                                                    className="h-52 w-full object-cover"
                                                    onLoad={() => {
                                                        setLoadedImageIds((prev) => (prev.includes(photo.id) ? prev : [...prev, photo.id]));
                                                    }}
                                                />
                                            </div>
                                            <div className="p-3 text-xs text-muted-foreground">{photo.name}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Photos will appear here after upload.</p>
                            )}

                            {isOwner && (
                                <form className="space-y-3" onSubmit={handleUploadPhotos}>
                                    <input
                                        ref={uploadInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                        multiple
                                        className="hidden"
                                        onChange={(event) => {
                                            addFiles(Array.from(event.target.files ?? []));
                                            event.currentTarget.value = "";
                                        }}
                                    />

                                    <div
                                        className={`rounded-lg border border-dashed p-4 transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            setIsDragActive(true);
                                        }}
                                        onDragLeave={(event) => {
                                            event.preventDefault();
                                            setIsDragActive(false);
                                        }}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            setIsDragActive(false);
                                            addFiles(Array.from(event.dataTransfer.files ?? []));
                                        }}
                                    >
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <ImagePlus className="size-6 text-muted-foreground" />
                                            <p className="text-sm text-foreground">Drag and drop photos here</p>
                                            <p className="text-xs text-muted-foreground">Up to {MAX_LISTING_PHOTOS} photos total for this listing</p>
                                            <Button type="button" variant="outline" size="sm" onClick={() => uploadInputRef.current?.click()}>
                                                Browse Files
                                            </Button>
                                        </div>
                                    </div>

                                    {pendingFilePreviews.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-muted-foreground">
                                                    {pendingFilePreviews.length} file(s) ready to upload
                                                </p>
                                                <Button type="button" variant="ghost" size="sm" onClick={clearSelectedFiles}>
                                                    Clear All
                                                </Button>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                {pendingFilePreviews.map((preview) => (
                                                    <div key={preview.id} className="overflow-hidden rounded-lg border border-border bg-muted/20">
                                                        <div className="relative h-36 w-full">
                                                            <img src={preview.url} alt={preview.name} className="h-36 w-full object-cover" />
                                                            <button
                                                                type="button"
                                                                className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
                                                                onClick={() => removeSelectedFile(preview.id)}
                                                                aria-label={`Remove ${preview.name}`}
                                                            >
                                                                <X className="size-4" />
                                                            </button>
                                                        </div>
                                                        <div className="truncate p-2 text-xs text-muted-foreground">{preview.name}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button type="submit" disabled={uploadPhotoMutation.isPending || selectedFiles.length === 0}>
                                        {uploadPhotoMutation.isPending ? "Uploading photos..." : "Upload Photos"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{isOwner ? "Manage Listing" : "Interested in this listing?"}</CardTitle>
                        <CardDescription>
                            {isOwner ? "Edit details, upload photos, or browse more." : "Start a conversation with the seller."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {feedbackMessage && <p className="text-sm text-muted-foreground">{feedbackMessage}</p>}
                        {isOwner && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => (isEditOpen ? setIsEditOpen(false) : openEdit())}
                            >
                                {isEditOpen ? "Close Edit Form" : "Edit Listing"}
                            </Button>
                        )}
                        {!isOwner && (
                            <Button className="w-full" onClick={() => startConversationMutation.mutate()} disabled={startConversationMutation.isPending}>
                                {startConversationMutation.isPending ? "Starting chat..." : "Message Seller"}
                            </Button>
                        )}
                        {!isOwner && (
                            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                                <p className="text-sm font-medium">Secure with Escrow</p>
                                <div className="space-y-1">
                                    <Label htmlFor="payment-amount" required>Amount</Label>
                                    <Input
                                        id="payment-amount"
                                        type="number"
                                        min={0.01}
                                        step="0.01"
                                        value={paymentAmount || ""}
                                        onChange={(event) => setPaymentAmount(Number(event.target.value))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="payment-note">Note (optional)</Label>
                                    <Textarea
                                        id="payment-note"
                                        value={paymentNote}
                                        onChange={(event) => setPaymentNote(event.target.value)}
                                        placeholder="Add context for this payment hold"
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => createPaymentMutation.mutate()}
                                    disabled={createPaymentMutation.isPending || paymentAmount <= 0 || !listing?.ownerId}
                                >
                                    {createPaymentMutation.isPending ? "Creating hold..." : "Initiate Payment Hold"}
                                </Button>
                            </div>
                        )}
                        <Button variant="outline" className="w-full" asChild>
                            <Link to="/app/listings">Browse More Listings</Link>
                        </Button>
                    </CardContent>
                </Card>

                {isOwner && isEditOpen && editForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Listing</CardTitle>
                            <CardDescription>Changes are saved immediately.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="grid gap-3"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (editForm) updateListingMutation.mutate(editForm);
                                }}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="edit-title" required>Title</Label>
                                    <Input
                                        id="edit-title"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm((p) => p && ({ ...p, title: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-price" required>Price</Label>
                                        <Input
                                            id="edit-price"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={editForm.price || ""}
                                            onChange={(e) => setEditForm((p) => p && ({ ...p, price: Number(e.target.value) }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-location">Location</Label>
                                        <Input
                                            id="edit-location"
                                            value={editForm.location ?? ""}
                                            onChange={(e) => setEditForm((p) => p && ({ ...p, location: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-type">Type</Label>
                                        <select
                                            id="edit-type"
                                            className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
                                            value={editForm.type}
                                            onChange={(e) => setEditForm((p) => p && ({ ...p, type: e.target.value as LISTING_TYPE }))}
                                        >
                                            {LISTING_TYPE_OPTIONS.map((t) => (
                                                <option key={t} value={t}>{LISTING_TYPE_LABELS[t]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-status">Status</Label>
                                        <select
                                            id="edit-status"
                                            className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
                                            value={editForm.status}
                                            onChange={(e) => setEditForm((p) => p && ({ ...p, status: e.target.value as LISTING_STATUS }))}
                                        >
                                            {LISTING_STATUS_OPTIONS.map((s) => (
                                                <option key={s} value={s}>{LISTING_STATUS_LABELS[s]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description" required>Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={editForm.description}
                                        onChange={(e) => setEditForm((p) => p && ({ ...p, description: e.target.value }))}
                                    />
                                </div>
                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={updateListingMutation.isPending}>
                                        {updateListingMutation.isPending ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
