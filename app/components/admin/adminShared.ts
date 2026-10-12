import { Dimensions, StyleSheet } from "react-native";

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

export type StatusFilter = "all" | "pending" | "accepted" | "rejected";
export type DriveViewMode = "grid" | "list";

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return {
        label: "قيد المراجعة",
        bg: "#fef3c7",
        color: "#92400e",
        icon: "clock" as const,
      };
    case "accepted":
      return {
        label: "مقبول",
        bg: "#dcfce7",
        color: "#166534",
        icon: "check-circle" as const,
      };
    case "rejected":
      return {
        label: "مرفوض",
        bg: "#fee2e2",
        color: "#991b1b",
        icon: "x-circle" as const,
      };
    default:
      return {
        label: status,
        bg: "#f3f4f6",
        color: "#4b5563",
        icon: "info" as const,
      };
  }
};

export const formatDate = (isoString?: string) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

export const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

export const getFileExtBadge = (ext?: string) => {
  const clean = (ext || "").replace(/^\./, "").toUpperCase() || "PDF";
  if (clean === "PDF") {
    return { label: "PDF", bg: "#fee2e2", color: "#dc2626" };
  }
  if (clean === "DOC" || clean === "DOCX") {
    return { label: clean, bg: "#dbeafe", color: "#2563eb" };
  }
  if (clean === "TXT") {
    return { label: "TXT", bg: "#f3f4f6", color: "#4b5563" };
  }
  return { label: clean, bg: "#fef3c7", color: "#b8975a" };
};

export const adminStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f6f8",
  },
  topHeader: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  subPageBackRow: {
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  subPageBackBtn: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  subPageBackText: {
    color: "#0e2038",
    fontSize: 13.5,
    fontWeight: "700",
  },
  headerTitleWrap: {
    alignItems: "flex-end",
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    color: "#0e2038",
    fontSize: 15.5,
    fontWeight: "800",
    textAlign: "right",
  },
  headerSubtitle: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  adminBadge: {
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderColor: "#fde68a",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  adminBadgeText: {
    color: "#92400e",
    fontSize: 11,
    fontWeight: "700",
  },
  // ─── Overview Cards Styles ────────────────────────────────────────────────
  overviewContainer: {
    padding: 18,
    paddingBottom: 36,
  },
  welcomeBanner: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 18,
    flexDirection: "row-reverse",
    gap: 14,
    marginBottom: 22,
    padding: 18,
    shadowColor: "#0e2038",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeIconBox: {
    alignItems: "center",
    backgroundColor: "rgba(184, 151, 90, 0.16)",
    borderColor: "rgba(184, 151, 90, 0.35)",
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  welcomeTextWrap: {
    flex: 1,
  },
  welcomeTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  welcomeSubtitle: {
    color: "#cbd5e1",
    fontSize: 12.5,
    marginTop: 4,
    textAlign: "right",
  },
  sectionHeading: {
    color: "#0e2038",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "right",
  },
  overviewCardsList: {
    gap: 14,
  },
  adminFeatureCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e6ecf5",
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row-reverse",
    padding: 18,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  featureCardIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  featureCardCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  featureCardTitleRow: {
    alignItems: "center",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  featureCardTitle: {
    color: "#0e2038",
    fontSize: 16.5,
    fontWeight: "800",
    textAlign: "right",
  },
  featureCardDesc: {
    color: "#64748b",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 5,
    textAlign: "right",
  },
  // ─── Google Drive Books & Laws Styles ──────────────────────────────────────
  driveToolbar: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  breadcrumbBar: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row-reverse",
    gap: 6,
  },
  breadcrumbItem: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 5,
    maxWidth: "60%",
  },
  breadcrumbText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  breadcrumbTextActive: {
    color: "#0e2038",
    fontWeight: "800",
  },
  viewModeSwitch: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    flexDirection: "row-reverse",
    padding: 2,
  },
  viewModeBtn: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  viewModeBtnActive: {
    backgroundColor: "#fff",
    elevation: 1,
  },
  drivePrimaryBtn: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 12,
    flexDirection: "row-reverse",
    gap: 6,
    height: 42,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  drivePrimaryBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  driveScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  driveSectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  driveSectionLabel: {
    color: "#4b5563",
    fontSize: 12.5,
    fontWeight: "700",
    textAlign: "right",
  },
  quickUploadLink: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 4,
  },
  quickUploadLinkText: {
    color: "#b8975a",
    fontSize: 12.5,
    fontWeight: "700",
  },
  driveGridContainer: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  driveListContainer: {
    gap: 10,
  },
  folderGridCard: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    width: "48.2%",
  },
  folderGridTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  folderIconWrap: {
    alignItems: "center",
    backgroundColor: "#fef9ee",
    borderColor: "#fde68a",
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  folderDeleteIconBtn: {
    alignItems: "center",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  folderGridName: {
    color: "#0e2038",
    fontSize: 14.5,
    fontWeight: "800",
    minHeight: 38,
    textAlign: "right",
  },
  folderGridFooter: {
    alignItems: "center",
    borderTopColor: "#f3f4f6",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
  },
  folderGridOpenHint: {
    color: "#6b7280",
    fontSize: 11.5,
    fontWeight: "600",
  },
  folderListRow: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 12,
    padding: 14,
  },
  folderIconWrapSmall: {
    alignItems: "center",
    backgroundColor: "#fef9ee",
    borderColor: "#fde68a",
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  folderListInfo: {
    flex: 1,
  },
  folderListName: {
    color: "#0e2038",
    fontSize: 14.5,
    fontWeight: "700",
    textAlign: "right",
  },
  folderListSub: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  folderListDeleteBtn: {
    padding: 6,
  },
  // ─── Books Cards (Inside Folder) ───────────────────────────────────────────
  bookGridCard: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    width: "48.2%",
  },
  bookGridPreviewArea: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    height: 92,
    justifyContent: "center",
    position: "relative",
  },
  extBadge: {
    borderRadius: 6,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    position: "absolute",
    top: 8,
  },
  extBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  bookFileCenterIcon: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  bookGridBody: {
    padding: 12,
  },
  bookGridTitle: {
    color: "#0e2038",
    fontSize: 13.5,
    fontWeight: "800",
    minHeight: 36,
    textAlign: "right",
  },
  bookGridDesc: {
    color: "#6b7280",
    fontSize: 11.5,
    marginTop: 2,
    textAlign: "right",
  },
  bookGridMeta: {
    color: "#9ca3af",
    fontSize: 10.5,
    marginTop: 4,
    textAlign: "right",
  },
  bookGridActions: {
    alignItems: "center",
    borderTopColor: "#f3f4f6",
    borderTopWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    marginTop: 10,
    paddingTop: 8,
  },
  bookIconActionBtn: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  bookListRow: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    padding: 12,
  },
  bookListMainTouch: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row-reverse",
    gap: 12,
  },
  bookListIconBox: {
    alignItems: "center",
    borderRadius: 10,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  bookListExtText: {
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },
  bookListInfo: {
    flex: 1,
  },
  bookListTitle: {
    color: "#0e2038",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  bookListDesc: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
    textAlign: "right",
  },
  bookListMeta: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  bookListActions: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 6,
    marginRight: 8,
  },
  emptyActionBtn: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 12,
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  emptyActionBtnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "700",
  },
  // ─── Upload & Form Modal Specific Styles ───────────────────────────────────
  inputLabel: {
    color: "#0e2038",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
    textAlign: "right",
  },
  singleLineInput: {
    borderColor: "#e5e7eb",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0e2038",
    fontSize: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "right",
  },
  categoryChipsScroll: {
    flexDirection: "row-reverse",
    gap: 8,
    paddingVertical: 4,
  },
  categorySelectChip: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categorySelectChipActive: {
    backgroundColor: "#0e2038",
    borderColor: "#0e2038",
  },
  categorySelectChipText: {
    color: "#374151",
    fontSize: 12.5,
    fontWeight: "600",
  },
  categorySelectChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  fileDropZone: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderColor: "#d1d5db",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1.5,
    justifyContent: "center",
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  fileDropIconCircle: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginBottom: 8,
    width: 44,
  },
  fileDropTitle: {
    color: "#0e2038",
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "center",
  },
  fileDropSubtitle: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  pickedFileBox: {
    alignItems: "center",
    backgroundColor: "#fef9ee",
    borderColor: "#fde68a",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 10,
    marginVertical: 4,
    padding: 12,
  },
  pickedFileIconWrap: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  pickedFileDetails: {
    flex: 1,
  },
  pickedFileName: {
    color: "#0e2038",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  pickedFileSize: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  changeFileBtn: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  changeFileBtnText: {
    color: "#b8975a",
    fontSize: 12,
    fontWeight: "700",
  },
  primaryModalBtn: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 10,
    flex: 1,
    flexDirection: "row-reverse",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 12,
  },
  // ─── Verification & Subscription Styles ────────────────────────────────────
  tabContent: {
    flex: 1,
  },
  filtersRow: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: "#0e2038",
    borderColor: "#0e2038",
  },
  filterChipText: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    marginBottom: 16,
    width: 72,
  },
  emptyTitle: {
    color: "#0e2038",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  listContainer: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row-reverse",
    gap: 4,
    justifyContent: "space-between",
    paddingBottom: 6,
  },
  lawyerMainInfo: {
    alignItems: "flex-end",
    flex: 1,
  },
  lawyerName: {
    color: "#0e2038",
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
  },
  requestDate: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsSection: {
    gap: 6,
    paddingVertical: 6,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 8,
  },
  detailText: {
    color: "#374151",
    fontSize: 13,
    textAlign: "right",
  },
  rejectionNotice: {
    alignItems: "flex-start",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 6,
    marginBottom: 8,
    padding: 10,
  },
  rejectionNoticeText: {
    color: "#991b1b",
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "right",
  },
  cardActions: {
    alignItems: "center",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  viewCardBtn: {
    alignItems: "center",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewCardBtnText: {
    color: "#0e2038",
    fontSize: 13,
    fontWeight: "600",
  },
  decisionButtons: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  acceptBtn: {
    alignItems: "center",
    backgroundColor: "#16a34a",
    borderRadius: 8,
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  rejectBtn: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 8,
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rejectBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(14,32,56,0.6)",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  previewOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.96)",
    flex: 1,
  },
  previewSafeArea: {
    flex: 1,
  },
  previewHeader: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewCloseBtn: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  previewTitle: {
    color: "#ffffff",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 12,
    textAlign: "right",
  },
  previewBody: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  imageScrollView: {
    flex: 1,
    width: "100%",
  },
  imageScrollContainer: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
  },
  fullSizePhoto: {
    height: SCREEN_HEIGHT * 0.85,
    width: SCREEN_WIDTH,
  },
  imageLoadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  imageLoadingTextLight: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: 10,
  },
  modalHeaderRow: {
    alignItems: "center",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    color: "#0e2038",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  rejectionModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxWidth: 420,
    padding: 18,
    width: "100%",
  },
  rejectionModalSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 10,
    textAlign: "right",
  },
  rejectionTextInput: {
    borderColor: "#e5e7eb",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0e2038",
    fontSize: 14,
    height: 100,
    marginBottom: 16,
    padding: 12,
    textAlign: "right",
  },
  rejectionActionsRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  confirmRejectBtn: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 10,
    flex: 1,
    flexDirection: "row-reverse",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 12,
  },
  confirmRejectBtnDisabled: {
    opacity: 0.5,
  },
  confirmRejectBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelRejectBtn: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  cancelRejectBtnText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "600",
  },
  lawFolderActionsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  lawArticleCard: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  lawArticleHeader: {
    alignItems: "center",
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 10,
  },
  lawArticleBadge: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 8,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lawArticleBadgeText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "700",
  },
  lawArticleActions: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 6,
  },
  lawArticleContentText: {
    color: "#1f2937",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
  },
});

