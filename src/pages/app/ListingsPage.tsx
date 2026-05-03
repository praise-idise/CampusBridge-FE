import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import {
    LISTING_TYPE,
    LISTING_TYPE_LABELS,
    LISTING_TYPE_OPTIONS,
    isApiError,
    type CreateListingRequestDTO,
    type Listing,
    type ListingRequestParameters,
} from "@/api/types";
import { createListing, deleteListing, getListings, getListingsBrowse, uploadListingPhoto } from "@/services/listings.service";
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
    Textarea,
} from "@/components/ui";

const PAGE_SIZE = 12;

type TabKey = "browse" | "mine";

export function ListingsPage() {
    const queryClient = useQueryClient();
    const createUploadInputRef = useRef<HTMLInputElement | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("browse");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState<LISTING_TYPE | "">("");
    const [pageNumber, setPageNumber] = useState(1);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
    const [pendingPhotoPreviews, setPendingPhotoPreviews] = useState<Array<{ id: string; name: string; url: string }>>([]);
    const [isCreateDragActive, setIsCreateDragActive] = useState(false);
    const [newListing, setNewListing] = useState<CreateListingRequestDTO>({
        title: "",
        description: "",
        price: 0,
        location: "",
        type: LISTING_TYPE.OTHER,
    });

    const requestParams: ListingRequestParameters = {
        pageNumber,
        pageSize: PAGE_SIZE,
        search: searchTerm || undefined,
        type: selectedType || undefined,
    };

    const browseQuery = useQuery({
        queryKey: ["listings-browse", requestParams],
        queryFn: () => getListingsBrowse(requestParams),
        enabled: activeTab === "browse",
    });

    const myListingsQuery = useQuery({
        queryKey: ["listings-mine", requestParams],
        queryFn: () => getListings(requestParams),
        enabled: activeTab === "mine",
    });

    const activeQuery = activeTab === "browse" ? browseQuery : myListingsQuery;
    const listings: Listing[] = activeQuery.data?.data ?? [];
    const pagination = activeQuery.data?.pagination;

    const createListingMutation = useMutation({
        mutationFn: async ({ listing, photos }: { listing: CreateListingRequestDTO; photos: File[] }) => {
            const result = await createListing(listing);
            if (photos.length > 0 && result.data?.id) {
                for (const file of photos) {
                    await uploadListingPhoto(result.data.id, file);
                }
            }
            return result;
        },
        onSuccess: () => {
            setNewListing({ title: "", description: "", price: 0, location: "", type: LISTING_TYPE.OTHER });
            clearCreatePendingPhotos();
            setIsCreateOpen(false);
            setErrorMessage(null);
            queryClient.invalidateQueries({ queryKey: ["listings-mine"] });
            queryClient.invalidateQueries({ queryKey: ["listings-browse"] });
        },
        onError: (error) => {
            setErrorMessage(isApiError(error) ? error.message : "Failed to create listing.");
        },
    });

    const deleteListingMutation = useMutation({
        mutationFn: deleteListing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listings-mine"] });
            queryClient.invalidateQueries({ queryKey: ["listings-browse"] });
        },
        onError: (error) => {
            setErrorMessage(isApiError(error) ? error.message : "Failed to delete listing.");
        },
    });

    function handleDeleteListing(listingId: string) {
        const confirmed = window.confirm("Are you sure you want to delete this listing?");
        if (!confirmed) return;
        deleteListingMutation.mutate(listingId);
    }

    function handleTabChange(tab: TabKey) {
        setActiveTab(tab);
        setPageNumber(1);
        setSearchTerm("");
        setSelectedType("");
        setIsCreateOpen(false);
        clearCreatePendingPhotos();
        setErrorMessage(null);
    }

    function handleCreateListing(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!newListing.title.trim() || !newListing.description.trim() || newListing.price <= 0) {
            setErrorMessage("Title, description, and a valid price are required.");
            return;
        }

        createListingMutation.mutate({
            listing: {
                ...newListing,
                title: newListing.title.trim(),
                description: newListing.description.trim(),
                location: newListing.location?.trim() || undefined,
            },
            photos: pendingPhotos,
        });
    }

    function addCreatePhotos(files: File[]) {
        if (!files.length) return;

        const existingIds = new Set(pendingPhotos.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
        const uniqueFiles = files.filter((file) => !existingIds.has(`${file.name}-${file.size}-${file.lastModified}`));
        const remainingSlots = Math.max(0, 3 - pendingPhotos.length);
        const filesToAdd = uniqueFiles.slice(0, remainingSlots);

        if (filesToAdd.length < uniqueFiles.length) {
            setErrorMessage("Only up to 3 photos are allowed per listing.");
        } else {
            setErrorMessage(null);
        }

        if (!filesToAdd.length) return;

        setPendingPhotos((prev) => [...prev, ...filesToAdd]);
        setPendingPhotoPreviews((prev) => [
            ...prev,
            ...filesToAdd.map((file) => ({
                id: `${file.name}-${file.size}-${file.lastModified}`,
                name: file.name,
                url: URL.createObjectURL(file),
            })),
        ]);
    }

    function removeCreatePhoto(photoId: string) {
        const toRemove = pendingPhotoPreviews.find((preview) => preview.id === photoId);
        if (toRemove) {
            URL.revokeObjectURL(toRemove.url);
        }

        setPendingPhotoPreviews((prev) => prev.filter((preview) => preview.id !== photoId));
        setPendingPhotos((prev) => prev.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== photoId));
    }

    function clearCreatePendingPhotos() {
        pendingPhotoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
        setPendingPhotoPreviews([]);
        setPendingPhotos([]);
        if (createUploadInputRef.current) {
            createUploadInputRef.current.value = "";
        }
    }

    useEffect(() => {
        return () => {
            pendingPhotoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [pendingPhotoPreviews]);

    return (
        <main className="min-w-0 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Market Place</h1>
                <p className="text-sm text-muted-foreground">Browse active listings across campus or manage your own.</p>
            </div>

            <div className="flex w-fit gap-1 rounded-lg border border-border bg-muted/30 p-1">
                <button
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "browse" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => handleTabChange("browse")}
                >
                    Browse Campus
                </button>
                <button
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "mine" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => handleTabChange("mine")}
                >
                    My Listings
                </button>
            </div>

            <Card>
                <CardContent className="pt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
                    <Input
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value);
                            setPageNumber(1);
                        }}
                        placeholder="Search by title or description"
                    />
                    <select
                        className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
                        value={selectedType}
                        onChange={(event) => {
                            const value = event.target.value;
                            setSelectedType(value ? (value as LISTING_TYPE) : "");
                            setPageNumber(1);
                        }}
                    >
                        <option value="">All Types</option>
                        {LISTING_TYPE_OPTIONS.map((type) => (
                            <option key={type} value={type}>
                                {LISTING_TYPE_LABELS[type]}
                            </option>
                        ))}
                    </select>
                    <Button variant="outline" onClick={() => activeQuery.refetch()} disabled={activeQuery.isFetching}>
                        Refresh
                    </Button>
                </CardContent>
            </Card>

            {activeTab === "mine" && (
                <div className="flex justify-end">
                    <Button onClick={() => setIsCreateOpen((v) => !v)}>
                        {isCreateOpen ? "Close" : "Create Listing"}
                    </Button>
                </div>
            )}

            {activeTab === "mine" && isCreateOpen && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Listing</CardTitle>
                        <CardDescription>Goes live immediately. Add more photos from the listing page later.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-4" onSubmit={handleCreateListing}>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="listing-title" required>
                                        Title
                                    </Label>
                                    <Input
                                        id="listing-title"
                                        value={newListing.title}
                                        onChange={(e) => setNewListing((p) => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. Room near North Gate"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="listing-price" required>
                                        Price
                                    </Label>
                                    <Input
                                        id="listing-price"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={newListing.price || ""}
                                        onChange={(e) => setNewListing((p) => ({ ...p, price: Number(e.target.value) }))}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="listing-type">Type</Label>
                                    <select
                                        id="listing-type"
                                        className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
                                        value={newListing.type}
                                        onChange={(e) => setNewListing((p) => ({ ...p, type: e.target.value as LISTING_TYPE }))}
                                    >
                                        {LISTING_TYPE_OPTIONS.map((type) => (
                                            <option key={type} value={type}>
                                                {LISTING_TYPE_LABELS[type]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="listing-location">Location</Label>
                                    <Input
                                        id="listing-location"
                                        value={newListing.location}
                                        onChange={(e) => setNewListing((p) => ({ ...p, location: e.target.value }))}
                                        placeholder="Campus area"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="listing-description" required>
                                    Description
                                </Label>
                                <Textarea
                                    id="listing-description"
                                    value={newListing.description}
                                    onChange={(e) => setNewListing((p) => ({ ...p, description: e.target.value }))}
                                    placeholder="Describe what you are offering..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="listing-photos">Photos (optional)</Label>
                                <input
                                    ref={createUploadInputRef}
                                    id="listing-photos"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={(event) => {
                                        addCreatePhotos(Array.from(event.target.files ?? []));
                                        event.currentTarget.value = "";
                                    }}
                                />
                                <div
                                    className={`rounded-lg border border-dashed p-4 transition-colors ${isCreateDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        setIsCreateDragActive(true);
                                    }}
                                    onDragLeave={(event) => {
                                        event.preventDefault();
                                        setIsCreateDragActive(false);
                                    }}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        setIsCreateDragActive(false);
                                        addCreatePhotos(Array.from(event.dataTransfer.files ?? []));
                                    }}
                                >
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <ImagePlus className="size-6 text-muted-foreground" />
                                        <p className="text-sm text-foreground">Drag and drop photos here</p>
                                        <p className="text-xs text-muted-foreground">Up to 3 photos per listing</p>
                                        <Button type="button" variant="outline" size="sm" onClick={() => createUploadInputRef.current?.click()}>
                                            Browse Files
                                        </Button>
                                    </div>
                                </div>

                                {pendingPhotoPreviews.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">{pendingPhotoPreviews.length} file(s) ready to upload</p>
                                            <Button type="button" variant="ghost" size="sm" onClick={clearCreatePendingPhotos}>
                                                Clear All
                                            </Button>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            {pendingPhotoPreviews.map((preview) => (
                                                <div key={preview.id} className="overflow-hidden rounded-lg border border-border bg-muted/20">
                                                    <div className="relative h-36 w-full">
                                                        <img src={preview.url} alt={preview.name} className="h-36 w-full object-cover" />
                                                        <button
                                                            type="button"
                                                            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
                                                            onClick={() => removeCreatePhoto(preview.id)}
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
                            </div>
                            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        clearCreatePendingPhotos();
                                        setIsCreateOpen(false);
                                        setErrorMessage(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createListingMutation.isPending}>
                                    {createListingMutation.isPending ? "Creating..." : "Create Listing"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>{activeTab === "browse" ? "All Campus Listings" : "My Listings"}</CardTitle>
                    <CardDescription>
                        {pagination
                            ? `Page ${pagination.pageNumber} of ${pagination.totalPages} (${pagination.totalRecords} total)`
                            : activeTab === "browse"
                                ? "Active listings from students on campus"
                                : "Listings you have created"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activeQuery.isLoading && <p className="text-sm text-muted-foreground">Loading listings...</p>}
                    {!activeQuery.isLoading && listings.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            {activeTab === "mine"
                                ? 'You have no listings yet. Click "Create Listing" above to get started.'
                                : "No active listings found."}
                        </p>
                    )}

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {listings.map((listing) => (
                            <div key={listing.id} className="rounded-lg border border-border p-4 transition-shadow hover:shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-2">
                                        <Link
                                            to="/app/listings/$listingId"
                                            params={{ listingId: listing.id }}
                                            className="line-clamp-2 text-base font-semibold hover:text-primary"
                                        >
                                            {listing.title}
                                        </Link>
                                        <Badge>{LISTING_TYPE_LABELS[listing.type]}</Badge>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-base font-semibold">{listing.price.toFixed(2)}</p>
                                        {listing.location && <p className="text-xs text-muted-foreground">{listing.location}</p>}
                                    </div>
                                </div>

                                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{listing.description}</p>

                                <div className="mt-4 flex flex-wrap justify-between gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to="/app/listings/$listingId" params={{ listingId: listing.id }}>
                                            View
                                        </Link>
                                    </Button>
                                    {activeTab === "mine" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => handleDeleteListing(listing.id)}
                                            disabled={deleteListingMutation.isPending}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination && (
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                                disabled={pageNumber <= 1 || activeQuery.isFetching}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setPageNumber((prev) => prev + 1)}
                                disabled={pagination.pageNumber >= pagination.totalPages || activeQuery.isFetching}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
