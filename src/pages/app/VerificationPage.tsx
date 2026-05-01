import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { KYC_STATUS, KYC_STATUS_LABELS, isApiError } from "@/api/types";
import { downloadKycDocument, getKycStatus, uploadStudentId, verifyFace, verifyPhone } from "@/services/kyc.service";
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui";

export function VerificationPage() {
    const queryClient = useQueryClient();
    const uploadInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
    const [uploadedPreview, setUploadedPreview] = useState<{ url: string; name: string } | null>(null);
    const [latestStatus, setLatestStatus] = useState<KYC_STATUS>(KYC_STATUS.NONE);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    const statusQuery = useQuery({
        queryKey: ["kyc-status"],
        queryFn: getKycStatus,
    });

    useEffect(() => {
        if (statusQuery.data?.data?.status) {
            setLatestStatus(statusQuery.data.data.status);
            setRejectionReason(statusQuery.data.data.rejectionReason ?? null);
        }
    }, [statusQuery.data]);

    useEffect(() => {
        let cancelled = false;
        let urlToRevoke: string | null = null;

        async function loadCurrentDocument() {
            const documentId = statusQuery.data?.data?.currentDocumentId;
            if (!documentId) {
                setUploadedPreview(null);
                return;
            }

            try {
                const result = await downloadKycDocument(documentId);
                const url = URL.createObjectURL(result.blob);
                urlToRevoke = url;

                if (!cancelled) {
                    setUploadedPreview({
                        url,
                        name: result.filename ?? statusQuery.data?.data?.currentDocumentFileName ?? "Student ID",
                    });
                }
            } catch {
                if (!cancelled) {
                    setUploadedPreview(null);
                }
            }
        }

        void loadCurrentDocument();

        return () => {
            cancelled = true;
            if (urlToRevoke) {
                URL.revokeObjectURL(urlToRevoke);
            }
        };
    }, [statusQuery.data?.data?.currentDocumentFileName, statusQuery.data?.data?.currentDocumentId]);

    useEffect(() => {
        return () => {
            if (selectedFilePreview) {
                URL.revokeObjectURL(selectedFilePreview);
            }
        };
    }, [selectedFilePreview]);

    function setPickedFile(file: File | null) {
        if (selectedFilePreview) {
            URL.revokeObjectURL(selectedFilePreview);
        }

        if (!file) {
            setSelectedFile(null);
            setSelectedFilePreview(null);
            return;
        }

        setSelectedFile(file);
        setSelectedFilePreview(URL.createObjectURL(file));
    }

    function handleLockedUploadAttempt() {
        setFeedbackMessage(latestStatus === KYC_STATUS.VERIFIED
            ? "Your ID has already been approved. Upload is disabled."
            : "Your ID image is already uploaded and is being confirmed by the system.");
    }

    const uploadMutation = useMutation({
        mutationFn: uploadStudentId,
        onSuccess: (response) => {
            if (response.data) {
                setLatestStatus(response.data.status);
            }
            setFeedbackMessage("Student ID uploaded successfully. Your image is being confirmed by the system.");
            queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard", "kyc-status"] });
        },
        onError: (error) => {
            setFeedbackMessage(isApiError(error) ? error.message : "Failed to upload student ID.");
        },
    });

    const verifyFaceMutation = useMutation({
        mutationFn: verifyFace,
        onSuccess: (response) => {
            setLatestStatus(response.data?.status ?? latestStatus);
            setFeedbackMessage(response.message || "Face verification request submitted.");
            queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard", "kyc-status"] });
        },
        onError: (error) => {
            setFeedbackMessage(isApiError(error) ? error.message : "Failed to verify face.");
        },
    });

    const verifyPhoneMutation = useMutation({
        mutationFn: verifyPhone,
        onSuccess: (response) => {
            setLatestStatus(response.data?.status ?? latestStatus);
            setFeedbackMessage(response.message || "Phone verification request submitted.");
            queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard", "kyc-status"] });
        },
        onError: (error) => {
            setFeedbackMessage(isApiError(error) ? error.message : "Failed to verify phone.");
        },
    });

    function handleUpload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedFile) {
            setFeedbackMessage("Please select an ID image before uploading.");
            return;
        }

        uploadMutation.mutate({ file: selectedFile });
    }

    const uploadsLocked = latestStatus === KYC_STATUS.PENDING || latestStatus === KYC_STATUS.VERIFIED;
    const previewToShow = uploadedPreview ?? (selectedFile && selectedFilePreview
        ? { url: selectedFilePreview, name: selectedFile.name }
        : null);

    return (
        <main className="min-w-0 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Student Verification</h1>
                <p className="text-sm text-muted-foreground">Submit your KYC details to unlock full marketplace access.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Verification Status</CardTitle>
                    <CardDescription>See your current review result and any next step.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Badge>{KYC_STATUS_LABELS[latestStatus]}</Badge>
                    {latestStatus === KYC_STATUS.PENDING && (
                        <p className="text-sm text-muted-foreground">Your uploaded ID is being confirmed by the system. Further uploads are disabled for now.</p>
                    )}
                    {latestStatus === KYC_STATUS.VERIFIED && (
                        <p className="text-sm text-muted-foreground">Your student ID has already been verified. No further upload is needed.</p>
                    )}
                    {latestStatus === KYC_STATUS.REJECTED && rejectionReason && (
                        <p className="text-sm text-destructive">Rejected: {rejectionReason}</p>
                    )}
                    {feedbackMessage && <p className="text-sm text-muted-foreground">{feedbackMessage}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Upload Student ID</CardTitle>
                    <CardDescription>Accepted image formats: jpg, jpeg, png, webp.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-3" onSubmit={handleUpload}>
                        <input
                            ref={uploadInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(event) => {
                                if (uploadsLocked) {
                                    handleLockedUploadAttempt();
                                    event.currentTarget.value = "";
                                    return;
                                }
                                const file = event.target.files?.[0] ?? null;
                                setPickedFile(file);
                                event.currentTarget.value = "";
                            }}
                        />
                        <div
                            className={`rounded-lg border border-dashed p-4 transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}
                            onDragOver={(event) => {
                                event.preventDefault();
                                if (uploadsLocked) return;
                                setIsDragActive(true);
                            }}
                            onDragLeave={(event) => {
                                event.preventDefault();
                                setIsDragActive(false);
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                setIsDragActive(false);
                                if (uploadsLocked) {
                                    handleLockedUploadAttempt();
                                    return;
                                }
                                const file = event.dataTransfer.files?.[0] ?? null;
                                setPickedFile(file);
                            }}
                        >
                            <div className="flex flex-col items-center gap-2 text-center">
                                <ImagePlus className="size-6 text-muted-foreground" />
                                <p className="text-sm text-foreground">Drag and drop your student ID here</p>
                                <p className="text-xs text-muted-foreground">One image file (jpg, jpeg, png, webp)</p>
                                <Button type="button" variant="outline" size="sm" onClick={() => uploadInputRef.current?.click()} disabled={uploadsLocked}>
                                    Browse File
                                </Button>
                            </div>
                        </div>

                        {previewToShow && (
                            <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                                <div className="relative h-44 w-full">
                                    <img src={previewToShow.url} alt={previewToShow.name} className="h-44 w-full object-cover" />
                                    {!uploadedPreview && (
                                        <button
                                            type="button"
                                            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
                                            onClick={() => setPickedFile(null)}
                                            aria-label="Remove selected KYC image"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="truncate p-2 text-xs text-muted-foreground">{previewToShow.name}</div>
                            </div>
                        )}
                        <Button type="submit" disabled={uploadMutation.isPending || !selectedFile || uploadsLocked}>
                            {uploadMutation.isPending ? "Uploading..." : "Upload ID"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Additional Checks</CardTitle>
                    <CardDescription>Trigger face and phone verification steps.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => verifyFaceMutation.mutate()} disabled={verifyFaceMutation.isPending}>
                        {verifyFaceMutation.isPending ? "Submitting..." : "Verify Face"}
                    </Button>
                    <Button variant="outline" onClick={() => verifyPhoneMutation.mutate()} disabled={verifyPhoneMutation.isPending}>
                        {verifyPhoneMutation.isPending ? "Submitting..." : "Verify Phone"}
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
