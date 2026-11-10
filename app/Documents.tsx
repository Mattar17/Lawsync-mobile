import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOfficeCases, type RemoteCase } from "./api/cases";
import {
  createTemplate,
  deleteTemplate,
  generateDocument,
  getAllTemplates,
  type LegalTemplate,
  type PlaceholderItem,
  type SelectedLogo,
} from "./api/templates";
import { useUserStore } from "./zustandStore/userStore";

// Stepper Step IDs
type StepId = 1 | 2 | 3 | 4 | 5;

// Template Types (App Templates vs Personal Templates)
export type TemplateType = "app" | "personal";

const TEMPLATE_TYPES: Array<{
  id: TemplateType;
  label: string;
  badge: string;
  icon: keyof typeof Feather.glyphMap;
  desc: string;
}> = [
  {
    id: "app",
    label: "قوالب التطبيق العامة",
    badge: "معتمدة من ميزان",
    icon: "globe",
    desc: "نماذج قانونية رسمية معتمدة ومجهزة مسبقاً، متاحة لجميع المحامين في النظام",
  },
  {
    id: "personal",
    label: "قوالبي الخاصة",
    badge: "مكتب المحامي",
    icon: "folder",
    desc: "الصيغ والنماذج المخصصة التي قمت برفعها أو كتابتها وتخصيصها لملفات مكتبك",
  },
];

export default function DocumentsScreen() {
  const user = useUserStore((state) => state.user);
  const office = useUserStore((state) => state.Office);

  // Stepper state (1: النوع, 2: المستند, 3: المصدر, 4: البيانات, 5: المعاينة)
  const [currentStep, setCurrentStep] = useState<StepId>(1);

  // Data states
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 1: Template Type (app | personal)
  const [selectedType, setSelectedType] = useState<TemplateType>("app");

  // Step 2: Selected Template
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(null);

  // Step 3: Source & Cases
  const [dataSource, setDataSource] = useState<"case" | "manual">("manual");
  const [cases, setCases] = useState<RemoteCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [caseModalVisible, setCaseModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<RemoteCase | null>(null);

  // Step 4: Form Fields
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<SelectedLogo | null>(null);

  // Step 5: Preview & Text Editing
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [isEditingText, setIsEditingText] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Create Template Modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createMode, setCreateMode] = useState<"file" | "text">("file");
  const [titleInput, setTitleInput] = useState("");
  const [rawTextInput, setRawTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type?: string;
    size?: number;
  } | null>(null);
  const [submittingTemplate, setSubmittingTemplate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load Templates
  const fetchTemplates = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAllTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر تحميل النماذج القانونية");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load Cases for Step 3
  const fetchCases = async () => {
    if (!office?.id) return;
    setLoadingCases(true);
    try {
      const data = await getOfficeCases(office.id);
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Could not fetch cases for template auto-fill:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCases();
  }, [office?.id]);

  // Convert raw HTML into readable structured text
  const cleanHtmlToText = (html: string) => {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<\/p>|<\/div>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim();
  };

  // Extract placeholder keys safely
  const getPlaceholderList = (template: LegalTemplate | null): Array<{ key: string; label: string }> => {
    if (!template || !template.placeholders) return [];
    return template.placeholders.map((ph: PlaceholderItem) => {
      if (typeof ph === "string") {
        return { key: ph, label: ph.replace(/_/g, " ") };
      }
      return {
        key: ph.key,
        label: ph.label || ph.key.replace(/_/g, " "),
      };
    });
  };

  // Check if a placeholder key represents a logo field
  const isLogoField = (key: string) => {
    const k = key.toLowerCase().trim().replace(/[{}]/g, "");
    return (
      k === "logo" ||
      k === "logo_url" ||
      k === "office_logo" ||
      k.includes("logo") ||
      k === "شعار" ||
      k === "شعار_المكتب" ||
      k === "شعار_المحامي" ||
      k.includes("شعار")
    );
  };

  // Pick logo file from ImagePicker or DocumentPicker
  const pickLogoFile = async () => {
    try {
      Alert.alert("اختيار شعار المكتب", "حدد طريقة اختيار ملف الشعار:", [
        { text: "إلغاء", style: "cancel" },
        {
          text: "معرض الصور",
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert("تنبيه", "يرجى السماح للتطبيق بالوصول للصور من إعدادات الجهاز");
              return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 0.9,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
              const asset = res.assets[0];
              setSelectedLogoFile({
                uri: asset.uri,
                name: asset.fileName || `logo_${Date.now()}.png`,
                type: asset.mimeType || "image/png",
              });
            }
          },
        },
        {
          text: "تصفح الملفات",
          onPress: async () => {
            const res = await DocumentPicker.getDocumentAsync({
              type: ["image/*"],
              copyToCacheDirectory: true,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
              const asset = res.assets[0];
              setSelectedLogoFile({
                uri: asset.uri,
                name: asset.name,
                type: asset.mimeType || "image/png",
              });
            }
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر اختيار ملف الشعار");
    }
  };

  // Step 1: Select Type
  const handleSelectType = (type: TemplateType) => {
    setSelectedType(type);
    setCurrentStep(2);
  };

  // Delete personal template
  const handleDeletePersonalTemplate = (template: LegalTemplate) => {
    Alert.alert(
      "حذف النموذج",
      `هل أنت متأكد من حذف نموذج "${template.title}" من مكتبك؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف نهائي",
          style: "destructive",
          onPress: async () => {
            setDeletingId(template.id);
            try {
              await deleteTemplate(template.id);
              fetchTemplates(true);
            } catch (err: any) {
              Alert.alert("خطأ", err.message || "تعذر حذف النموذج");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // Step 2: Select Template
  const handleSelectTemplate = (template: LegalTemplate) => {
    setSelectedTemplate(template);
    setSelectedLogoFile(null);
    const initialValues: Record<string, string> = {
      عنوان_مكتب_المحامي: office?.address || "السادات",
      اسم_المحامي: user?.name || "المحامي",
      التاريخ: new Date().toISOString().split("T")[0],
    };

    const placeholders = getPlaceholderList(template);
    placeholders.forEach(({ key }) => {
      if (!initialValues[key]) {
        initialValues[key] = "";
      }
    });

    setFormValues(initialValues);
    setCurrentStep(3);
  };

  // Step 3: Choose Source
  const handleChooseSourceManual = () => {
    setDataSource("manual");
    setSelectedCase(null);
    setCurrentStep(4);
  };

  const handleApplyCaseData = (c: RemoteCase) => {
    setSelectedCase(c);
    setDataSource("case");

    setFormValues((prev) => ({
      ...prev,
      اسم_الخصم: c.client_opponent_name || prev.اسم_الخصم || "",
      عنوان_الخصم: (c as any).client_opponent_address || prev.عنوان_الخصم || "",
      اسم_الموكل: c.client_name || prev.اسم_الموكل || "",
      اسم_الطالب: c.client_name || prev.اسم_الطالب || "",
      رقم_الدعوى: c.case_number ? `${c.case_number} لسنة ${c.case_year || "2026"}` : prev.رقم_الدعوى || "",
      المحكمة_المختصة: c.court_name || prev.المحكمة_المختصة || "",
      المحكمة: c.court_name || prev.المحكمة || "",
      الدائرة: c.court_circuit || prev.الدائرة || "",
      موضوع_الدعوى: c.title || prev.موضوع_الدعوى || "",
      موضوع_القضية: c.title || prev.موضوع_القضية || "",
      عنوان_مكتب_المحامي: office?.address || prev.عنوان_مكتب_المحامي || "السادات",
      اسم_المحامي: user?.name || prev.اسم_المحامي || "المحامي",
    }));

    setCaseModalVisible(false);
    setCurrentStep(4);
  };

  // Step 4: Handle Form Change
  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Step 4 -> 5: Go to Preview
  const handleProceedToPreview = async () => {
    if (!selectedTemplate) return;

    setPreviewLoading(true);
    setCurrentStep(5);

    try {
      const response = await generateDocument(selectedTemplate.id, formValues, {
        preview: true,
        logo: selectedLogoFile,
      });

      const html = response?.html || response?.data?.html || "";
      setPreviewHtml(html);

      // Cleaned text representation for mobile reading & editing
      const readable = cleanHtmlToText(html);
      setDocumentText(readable || generateFallbackDocumentText());
    } catch (err: any) {
      console.log("Preview load error, using formatted fallback:", err.message);
      setDocumentText(generateFallbackDocumentText());
    } finally {
      setPreviewLoading(false);
    }
  };

  // Fallback text generator in legal style matching Image 2
  const generateFallbackDocumentText = () => {
    const oppName = formValues.اسم_الخصم || "[اسم الخصم]";
    const oppAddress = formValues.عنوان_الخصم || "[عنوان الخصم]";
    const clientName = formValues.اسم_الموكل || formValues.اسم_الطالب || user?.name || "علي";
    const officeAddr = formValues.عنوان_مكتب_المحامي || office?.address || "السادات";
    const lawyerName = formValues.اسم_المحامي || user?.name || "علي المحامي";
    const caseNum = formValues.رقم_الدعوى || "220 لسنة 2026";

    return `إنه في يوم الموافق / /

بناء على طلب السيد/ ${clientName}، المقيم في ${officeAddr}، ومحله المختار مكتب الأستاذ/ ${lawyerName}، الكائن في ${officeAddr}.

أنا محضر محكمة قد انتقلت في التاريخ المذكور أعلاه إلى محل إقامة:

السيد/ ${oppName}، المقيم في ${oppAddress}.

مخاطبًا مع/

وأعلنته بالآتي

أقامت الطالبة الدعوى رقم ${caseNum} ضد المعلن إليه، وقد تحدد لنظرها جلسة 2026/07/21، وبتلك الجلسة لم يحضر المعلن إليه أو وكيل عنه.

لذلك قررت الهيئة الموقرة تأجيل نظر الدعوى لجلسة 2026/09/21 لإعادة الإعلان.`;
  };

  // Step 5: Generate Final PDF
  const handleSaveAndExportPdf = async () => {
    if (!selectedTemplate) return;

    setGeneratingPdf(true);
    try {
      // Send either custom edited HTML/text or original form values
      const customHtmlToSend = isEditingText || documentText ? wrapTextInLegalHtml(documentText) : undefined;

      const response = await generateDocument(selectedTemplate.id, formValues, {
        customHtml: customHtmlToSend,
        logo: selectedLogoFile,
      });

      const pdfUrl =
        response?.pdfUrl ||
        response?.signedUrl ||
        response?.publicUrl ||
        response?.data?.pdfUrl ||
        response?.data?.signedUrl ||
        response?.data?.publicUrl;

      if (!pdfUrl) {
        throw new Error("لم يتم استلام رابط الملف من السيرفر");
      }

      setGeneratedPdfUrl(pdfUrl);
      setSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert("فشل التوليد", err.message || "تعذر توليد ملف الـ PDF وحفظه");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Wraps user-edited text in legal A4 HTML
  const wrapTextInLegalHtml = (text: string) => {
    const paragraphs = text
      .split(/\n\n+/)
      .map((p) => `<p style="text-align: justify; margin-bottom: 14px; line-height: 2.0; font-size: 14pt;">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");

    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>body{font-family:'Traditional Arabic',Tahoma,Arial,sans-serif;direction:rtl;padding:25mm 20mm;color:#111;}</style></head><body>${paragraphs}</body></html>`;
  };

  // Pick PDF file for uploading new template
  const pickPdfFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/pdf",
          size: asset.size,
        });

        if (!titleInput.trim() && asset.name) {
          const cleanName = asset.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
          setTitleInput(cleanName);
        }
      }
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر اختيار الملف");
    }
  };

  // Create Template Submission
  const handleCreateTemplate = async () => {
    if (createMode === "file" && !selectedFile) {
      Alert.alert("تنبيه", "يرجى اختيار ملف PDF للنموذج");
      return;
    }
    if (createMode === "text" && (!titleInput.trim() || !rawTextInput.trim())) {
      Alert.alert("تنبيه", "يرجى كتابة عنوان ونص النموذج");
      return;
    }

    setSubmittingTemplate(true);
    try {
      if (createMode === "file" && selectedFile) {
        const formData = new FormData();
        if (titleInput.trim()) formData.append("title", titleInput.trim());
        formData.append("file", {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type || "application/pdf",
        } as any);
        await createTemplate(formData);
      } else {
        await createTemplate({
          title: titleInput.trim(),
          rawArabicText: rawTextInput.trim(),
        });
      }

      Alert.alert("تمت الإضافة بنجاح", "تم تحويل المستند إلى قالب تفاعلي جاهز للتعبئة.");
      setTitleInput("");
      setRawTextInput("");
      setSelectedFile(null);
      setCreateModalVisible(false);
      setSelectedType("personal");
      fetchTemplates(true);
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر إضافة النموذج");
    } finally {
      setSubmittingTemplate(false);
    }
  };

  // Open PDF in browser
  const openPdfUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      await Linking.openURL(url);
    }
  };

  // Template counts
  const appTemplatesCount = templates.filter((t) => Boolean(t.is_app_template)).length;
  const personalTemplatesCount = templates.filter((t) => !t.is_app_template).length;

  // Filter templates by search and selected type (app vs personal)
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "app" ? Boolean(t.is_app_template) : !t.is_app_template;
    return matchesSearch && matchesType;
  });

  // Step names
  const STEPS = [
    { id: 1, label: "النوع" },
    { id: 2, label: "المستند" },
    { id: 3, label: "المصدر" },
    { id: 4, label: "البيانات" },
    { id: 5, label: "المعاينة" },
  ];

  return (
    <SafeAreaView style={styles.root}>
      {/* ─────────────────────────────────────────────────────────────
          TOP BRANDING BAR (Office Header - Matching Image 1 & 2)
      ────────────────────────────────────────────────────────────── */}
      <View style={styles.topOfficeBar}>
        <Text style={styles.topOfficeName}>
          مكتب {user?.name || office?.name || "علي حمدي يوسف"}
        </Text>
        <Text style={styles.topOfficeSubtitle}>للمحاماة والاستشارات القانونية</Text>
      </View>

      {/* ─────────────────────────────────────────────────────────────
          TITLE BAR WITH BACK & CLOSE (Matching Image 1 & 2)
      ────────────────────────────────────────────────────────────── */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep((prev) => (prev - 1) as StepId);
            } else {
              router.replace("/Choice" as never);
            }
          }}
        >
          <Feather name="arrow-right" size={22} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.screenTitleText}>كتابة النماذج القانونية</Text>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => {
            Alert.alert("إلغاء", "هل ترغب في الخروج من كتابة النموذج؟", [
              { text: "متابعة", style: "cancel" },
              { text: "خروج", onPress: () => router.replace("/Choice" as never) },
            ]);
          }}
        >
          <Feather name="x" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* ─────────────────────────────────────────────────────────────
          5-STEP STEPPER (Matching Image 1 & 2)
      ────────────────────────────────────────────────────────────── */}
      <View style={styles.stepperContainer}>
        {/* Connecting horizontal line */}
        <View style={styles.stepperLine} />

        <View style={styles.stepperStepsRow}>
          {STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;

            return (
              <TouchableOpacity
                key={step.id}
                style={styles.stepItem}
                activeOpacity={0.8}
                onPress={() => {
                  // Only allow jumping back to completed steps
                  if (step.id < currentStep) {
                    setCurrentStep(step.id as StepId);
                  }
                }}
              >
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isActive && styles.stepCircleActive,
                  ]}
                >
                  {isCompleted ? (
                    <Feather name="check" size={14} color="#ffffff" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumberText,
                        isActive && styles.stepNumberTextActive,
                      ]}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isActive || isCompleted) && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─────────────────────────────────────────────────────────────
          STEP 1: نوع النموذج (App Templates vs Personal Templates)
      ────────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <ScrollView contentContainerStyle={styles.contentPadding}>
          <Text style={styles.stepHeading}>اختر نوع النماذج القانونية</Text>
          <Text style={styles.stepSubheading}>
            حدد قوالب التطبيق العامة المعتمدة أو نماذجك وصيغك الخاصة للمتابعة
          </Text>

          <View style={styles.typeCardsContainer}>
            {TEMPLATE_TYPES.map((item) => {
              const count = item.id === "app" ? appTemplatesCount : personalTemplatesCount;
              const isSelected = selectedType === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.typeCard,
                    isSelected && styles.typeCardSelected,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => handleSelectType(item.id)}
                >
                  <View style={styles.typeCardTopRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        item.id === "app" ? styles.typeBadgeApp : styles.typeBadgePersonal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          item.id === "app"
                            ? styles.typeBadgeTextApp
                            : styles.typeBadgeTextPersonal,
                        ]}
                      >
                        {item.badge}
                      </Text>
                    </View>
                    <View style={styles.typeIconWrap}>
                      <Feather name={item.icon} size={22} color="#b8975a" />
                    </View>
                  </View>

                  <Text style={styles.typeTitle}>{item.label}</Text>
                  <Text style={styles.typeDesc}>{item.desc}</Text>

                  <View style={styles.typeCardFooter}>
                    <View style={styles.typeCountChip}>
                      <Feather name="file-text" size={13} color="#0e2038" />
                      <Text style={styles.typeCountChipText}>{count} نماذج متاحة</Text>
                    </View>

                    <View style={styles.typeActionBtn}>
                      <Text style={styles.typeActionBtnText}>اختيار</Text>
                      <Feather name="arrow-left" size={15} color="#b8975a" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: المستند (Document / Template Selection)
      ────────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <View style={{ flex: 1 }}>
          {/* Search & Add */}
          <View style={styles.templateSearchRow}>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="بحث في النماذج"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.addTemplateSmallBtn}
              onPress={() => setCreateModalVisible(true)}
            >
              <Feather name="plus" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Quick Scope Tabs Switcher */}
          <View style={styles.scopeTabsContainer}>
            <TouchableOpacity
              style={[
                styles.scopeTabBtn,
                selectedType === "app" && styles.scopeTabBtnActive,
              ]}
              onPress={() => setSelectedType("app")}
              activeOpacity={0.85}
            >
              <Feather
                name="globe"
                size={14}
                color={selectedType === "app" ? "#ffffff" : "#64748b"}
              />
              <Text
                style={[
                  styles.scopeTabBtnText,
                  selectedType === "app" && styles.scopeTabBtnTextActive,
                ]}
              >
                قوالب التطبيق ({appTemplatesCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.scopeTabBtn,
                selectedType === "personal" && styles.scopeTabBtnActive,
              ]}
              onPress={() => setSelectedType("personal")}
              activeOpacity={0.85}
            >
              <Feather
                name="folder"
                size={14}
                color={selectedType === "personal" ? "#ffffff" : "#64748b"}
              />
              <Text
                style={[
                  styles.scopeTabBtnText,
                  selectedType === "personal" && styles.scopeTabBtnTextActive,
                ]}
              >
                قوالبي الخاصة ({personalTemplatesCount})
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0e2038" />
              <Text style={styles.loadingText}>جاري تحميل النماذج...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.contentPadding}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchTemplates(true)} />
              }
            >
              {filteredTemplates.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather
                    name={selectedType === "app" ? "globe" : "folder-plus"}
                    size={40}
                    color="#94a3b8"
                  />
                  <Text style={styles.emptyTitle}>
                    {selectedType === "app"
                      ? "لا توجد قوالب تطبيق عامة"
                      : "لا توجد نماذج خاصة بمكتبك"}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {selectedType === "app"
                      ? "لم يتم العثور على نماذج عامة تطابق بحثك."
                      : "يمكنك رفع ملف PDF جديد أو كتابة نموذج بصيغتك الخاصة ليتم حفظه في مكتبك."}
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => setCreateModalVisible(true)}
                  >
                    <Feather name="upload" size={16} color="#ffffff" />
                    <Text style={styles.primaryActionBtnText}>إضافة نموذج جديد</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredTemplates.map((template) => {
                  const phs = getPlaceholderList(template);

                  return (
                    <TouchableOpacity
                      key={template.id}
                      style={styles.templateCard}
                      activeOpacity={0.88}
                      onPress={() => handleSelectTemplate(template)}
                    >
                      <View style={styles.templateCardRow}>
                        <View style={styles.templateIconWrap}>
                          <Feather
                            name={template.is_app_template ? "globe" : "file-text"}
                            size={20}
                            color="#b8975a"
                          />
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 10 }}>
                          <Text style={styles.templateTitle}>{template.title}</Text>
                          <View style={styles.templateMetaRow}>
                            <Text style={styles.templateMeta}>
                              الحقول المطلوبة: {phs.length} حقل
                            </Text>
                            <View
                              style={[
                                styles.templateScopeBadge,
                                template.is_app_template
                                  ? styles.templateScopeBadgeApp
                                  : styles.templateScopeBadgePersonal,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.templateScopeBadgeText,
                                  template.is_app_template
                                    ? styles.templateScopeBadgeTextApp
                                    : styles.templateScopeBadgeTextPersonal,
                                ]}
                              >
                                {template.is_app_template ? "قالب عام" : "قالب خاص"}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {!template.is_app_template && (
                          <TouchableOpacity
                            style={styles.deleteTemplateBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeletePersonalTemplate(template);
                            }}
                            disabled={deletingId === template.id}
                          >
                            {deletingId === template.id ? (
                              <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                              <Feather name="trash-2" size={16} color="#94a3b8" />
                            )}
                          </TouchableOpacity>
                        )}

                        <Feather name="chevron-left" size={20} color="#94a3b8" />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 3: المصدر (Source Selection)
      ────────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <ScrollView contentContainerStyle={styles.contentPadding}>
          <Text style={styles.stepHeading}>اختر مصدر بيانات النموذج</Text>
          <Text style={styles.stepSubheading}>
            النموذج المختار: {selectedTemplate?.title}
          </Text>

          {/* Option 1: From Registered Case */}
          <TouchableOpacity
            style={styles.sourceCard}
            activeOpacity={0.85}
            onPress={() => {
              if (cases.length === 0) {
                fetchCases();
              }
              setCaseModalVisible(true);
            }}
          >
            <View style={styles.sourceIconWrap}>
              <Feather name="briefcase" size={24} color="#b8975a" />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.sourceCardTitle}>استيراد البيانات من قضية مسجلة</Text>
              <Text style={styles.sourceCardDesc}>
                يتم الملء التلقائي لاسم الخصم، عنوانه، رقم الدعوى، واسم الموكل من بيانات القضية.
              </Text>
            </View>
            <Feather name="arrow-left" size={20} color="#b8975a" />
          </TouchableOpacity>

          {/* Option 2: Manual Entry */}
          <TouchableOpacity
            style={styles.sourceCard}
            activeOpacity={0.85}
            onPress={handleChooseSourceManual}
          >
            <View style={[styles.sourceIconWrap, { backgroundColor: "#f1f5f9" }]}>
              <Feather name="edit-3" size={24} color="#475569" />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.sourceCardTitle}>إدخال البيانات يدوياً</Text>
              <Text style={styles.sourceCardDesc}>
                البدء بنموذج فارغ وكتابة جميع الأسماء والبيانات بنفسك مباشرة.
              </Text>
            </View>
            <Feather name="arrow-left" size={20} color="#475569" />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 4: البيانات (Form Inputs - EXACTLY MATCHING IMAGE 1)
      ────────────────────────────────────────────────────────────── */}
      {currentStep === 4 && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.contentPadding}
            showsVerticalScrollIndicator={false}
          >

            {/* Other Dynamic Template Fields */}
            {getPlaceholderList(selectedTemplate)
              .filter(
                ({ key }) =>
                  key !== "عنوان_مكتب_المحامي" &&
                  key !== "اسم_الخصم" &&
                  key !== "عنوان_الخصم" &&
                  key !== "رقم_الدعوى"
              )
              .map(({ key, label }) => {
                if (isLogoField(key)) {
                  return (
                    <View key={key} style={styles.formSectionBox}>
                      <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabelStandalone}>{label || "شعار المكتب"}</Text>
                        <Text style={styles.fieldLabelOptional}>(صورة الشعار)</Text>
                      </View>

                      {selectedLogoFile ? (
                        <View style={styles.logoSelectedCard}>
                          <Image
                            source={{ uri: selectedLogoFile.uri }}
                            style={styles.logoPreviewImage}
                            resizeMode="contain"
                          />
                          <View style={styles.logoDetailsWrap}>
                            <Text style={styles.logoFileName} numberOfLines={1}>
                              {selectedLogoFile.name}
                            </Text>
                            <Text style={styles.logoFileStatus}>تم تحديد ملف الشعار بنجاح</Text>
                          </View>

                          <View style={styles.logoActionsRow}>
                            <TouchableOpacity
                              style={styles.logoChangeBtn}
                              onPress={pickLogoFile}
                            >
                              <Text style={styles.logoChangeBtnText}>تغيير</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.logoRemoveBtn}
                              onPress={() => setSelectedLogoFile(null)}
                            >
                              <Feather name="trash-2" size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.logoUploadBox}
                          activeOpacity={0.85}
                          onPress={pickLogoFile}
                        >
                          <View style={styles.logoUploadIconWrap}>
                            <Feather name="image" size={24} color="#b8975a" />
                          </View>
                          <Text style={styles.logoUploadTitle}>اضغط هنا لاختيار صورة الشعار</Text>
                          <Text style={styles.logoUploadSubtitle}>
                            يدعم صور PNG أو JPG (من المعرض أو ملفات الجهاز)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }

                return (
                  <View key={key} style={styles.formSectionBox}>
                    <Text style={styles.fieldLabelStandalone}>{label}</Text>
                    <TextInput
                      style={[
                        styles.roundedGrayInput,
                        focusedField === key && styles.inputFocused,
                      ]}
                      placeholder={`أدخل ${label}...`}
                      placeholderTextColor="#94a3b8"
                      value={formValues[key] || ""}
                      onChangeText={(t) => handleFieldChange(key, t)}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                );
              })}

            {/* Bottom Stepper Navigation Buttons */}
            <View style={styles.bottomNavButtonsRow}>
              <TouchableOpacity
                style={styles.navPrevBtn}
                onPress={() => setCurrentStep(3)}
              >
                <Text style={styles.navPrevBtnText}>السابق</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navNextBtn}
                onPress={handleProceedToPreview}
              >
                <Text style={styles.navNextBtnText}>المعاينة (5)</Text>
                <Feather name="arrow-left" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 5: المعاينة (Preview & Edit - EXACTLY MATCHING IMAGE 2)
      ────────────────────────────────────────────────────────────── */}
      {currentStep === 5 && (
        <ScrollView
          contentContainerStyle={styles.previewScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Office Sub-header on Document (Matching Image 2) */}
          <View style={styles.docOfficeHeaderCard}>
            <View style={styles.docOfficeHeaderRow}>
              <View style={{ alignItems: "flex-end", flex: 1 }}>
                <Text style={styles.docOfficeTitle}>
                  {office?.name || user?.name || "علي يوسف للمحاماة والاستشارات"}
                </Text>
                <Text style={styles.docOfficeAddress}>
                  {office?.address || "السادات - المنوفيه"}
                </Text>
                <Text style={styles.docOfficePhone}>
                  ت: {office?.phone || "01020689943"}
                </Text>
              </View>
              <View style={styles.docOfficeIconWrap}>
                <Feather name="more-horizontal" size={24} color="#b8975a" />
              </View>
            </View>
          </View>

          {/* Action Row: تعديل النص + يمكنك تعديل النص قبل الحفظ (Matching Image 2) */}
          <View style={styles.editActionHeaderRow}>
            <TouchableOpacity
              style={[
                styles.editTextPillBtn,
                isEditingText && styles.editTextPillBtnActive,
              ]}
              onPress={() => setIsEditingText(!isEditingText)}
            >
              <Feather
                name={isEditingText ? "check" : "edit-2"}
                size={16}
                color="#b8975a"
              />
              <Text style={styles.editTextPillBtnText}>
                {isEditingText ? "تأكيد النص" : "تعديل النص"}
              </Text>
            </TouchableOpacity>

            <View style={styles.editHintRow}>
              <Text style={styles.editHintText}>يمكنك تعديل النص قبل الحفظ</Text>
              <Feather name="file-text" size={16} color="#b8975a" />
            </View>
          </View>

          {/* White Paper Sheet (Matching Image 2) */}
          <View style={styles.a4PaperSheet}>
            {previewLoading ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0e2038" />
                <Text style={[styles.loadingText, { marginTop: 12 }]}>
                  جاري تجهيز نص النموذج وتنسيقه...
                </Text>
              </View>
            ) : isEditingText ? (
              /* Editable Text Mode */
              <TextInput
                style={styles.editableDocumentInput}
                multiline
                value={documentText}
                onChangeText={setDocumentText}
                textAlign="right"
                textAlignVertical="top"
              />
            ) : (
              /* Split Layout Matching Image 2: Main Body + Marginal Subject */
              <View style={styles.paperInnerRow}>
                {/* Right: Main Document Legal Text */}
                <View style={styles.paperMainColumn}>
                  <Text style={styles.legalBodyParagraph}>{documentText}</Text>
                </View>

                {/* Left: Marginal Subject Note (Matching Image 2) */}
                <View style={styles.paperMarginalColumn}>
                  <View style={styles.marginalDivider} />
                  <Text style={styles.marginalSubjectHeader}>الموضوع</Text>
                  <Text style={styles.marginalSubjectTitle}>
                    {selectedTemplate?.title || "اعادة اعلان"}
                  </Text>
                  <View style={styles.marginalDivider} />
                  <Text style={styles.marginalLawyerNote}>
                    {user?.name || "علي يوسف"} للمحاماة والاستشارات القانونية المحامي
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Step 5 Action Bar: Export PDF */}
          <View style={styles.previewActionFooter}>
            <TouchableOpacity
              style={[
                styles.saveAndExportBtn,
                generatingPdf && { opacity: 0.7 },
              ]}
              onPress={handleSaveAndExportPdf}
              disabled={generatingPdf}
            >
              {generatingPdf ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.saveAndExportBtnText}>
                    جاري التوليد والرفع إلى السحابة...
                  </Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Feather name="download-cloud" size={18} color="#ffffff" />
                  <Text style={styles.saveAndExportBtnText}>
                    حفظ وتصدير ملف PDF
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToEditInputsBtn}
              onPress={() => setCurrentStep(4)}
              disabled={generatingPdf}
            >
              <Text style={styles.backToEditInputsBtnText}>
                العودة لتعديل البيانات (4)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CASE SELECTION (Step 3 Source)
      ────────────────────────────────────────────────────────────── */}
      <Modal
        visible={caseModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCaseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.caseModalCard}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity
                onPress={() => setCaseModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={styles.modalTitleText}>اختر القضية لملء البيانات</Text>
            </View>

            {loadingCases ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0e2038" />
                <Text style={styles.loadingText}>جاري تحميل قضايا المكتب...</Text>
              </View>
            ) : cases.length === 0 ? (
              <View style={{ padding: 30, alignItems: "center" }}>
                <Feather name="inbox" size={36} color="#94a3b8" />
                <Text style={[styles.emptyTitle, { marginTop: 10 }]}>لا توجد قضايا مسجلة</Text>
                <Text style={styles.emptySubtitle}>
                  يمكنك إدخال البيانات يدوياً في النموذج.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { marginTop: 16 }]}
                  onPress={handleChooseSourceManual}
                >
                  <Text style={styles.primaryActionBtnText}>إدخال البيانات يدوياً</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 420 }}>
                {cases.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.caseItemCard}
                    activeOpacity={0.85}
                    onPress={() => handleApplyCaseData(c)}
                  >
                    <View style={styles.caseItemHeader}>
                      <Text style={styles.caseItemNumber}>
                        دعوى رقم {c.case_number || "—"} لسنة {c.case_year || "—"}
                      </Text>
                      {c.court_name && (
                        <Text style={styles.caseItemCourt}>{c.court_name}</Text>
                      )}
                    </View>
                    <Text style={styles.caseItemParties}>
                      الموكل: {c.client_name || "—"} | الخصم: {c.client_opponent_name || "—"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: SUCCESS PDF GENERATION
      ────────────────────────────────────────────────────────────── */}
      <Modal
        visible={successModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={32} color="#b8975a" />
            </View>

            <Text style={styles.successTitleText}>تم توليد المستند بنجاح! 📄</Text>
            <Text style={styles.successSubtitleText}>
              تم حفظ النموذج بصيغة PDF قياسية A4 عالية الدقة في وحدة التخزين السحابية.
            </Text>

            <TouchableOpacity
              style={styles.viewPdfSuccessBtn}
              onPress={() => {
                if (generatedPdfUrl) openPdfUrl(generatedPdfUrl);
              }}
            >
              <Feather name="external-link" size={18} color="#b8975a" />
              <Text style={styles.viewPdfSuccessBtnText}>عرض وتحميل ملف PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeSuccessBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                setCurrentStep(1);
              }}
            >
              <Text style={styles.closeSuccessBtnText}>إغلاق والعودة للنماذج</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE NEW TEMPLATE (AI/PDF UPLOAD)
      ────────────────────────────────────────────────────────────── */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!submittingTemplate) setCreateModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.caseModalCard}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                disabled={submittingTemplate}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={styles.modalTitleText}>إضافة نموذج قانوني جديد</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.fieldLabelStandalone}>عنوان النموذج</Text>
              <TextInput
                style={styles.roundedGrayInput}
                placeholder="مثال: عقد بيع عقار، إعادة إعلان..."
                placeholderTextColor="#94a3b8"
                value={titleInput}
                onChangeText={setTitleInput}
                editable={!submittingTemplate}
              />

              {/* Tabs */}
              <View style={styles.createTabRow}>
                <TouchableOpacity
                  style={[styles.createTabBtn, createMode === "file" && styles.createTabBtnActive]}
                  onPress={() => setCreateMode("file")}
                >
                  <Text style={[styles.createTabBtnText, createMode === "file" && styles.createTabBtnTextActive]}>
                    رفع ملف PDF
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.createTabBtn, createMode === "text" && styles.createTabBtnActive]}
                  onPress={() => setCreateMode("text")}
                >
                  <Text style={[styles.createTabBtnText, createMode === "text" && styles.createTabBtnTextActive]}>
                    كتابة نص مباشر
                  </Text>
                </TouchableOpacity>
              </View>

              {createMode === "file" ? (
                <TouchableOpacity style={styles.uploadDottedBox} onPress={pickPdfFile}>
                  <Feather name="upload-cloud" size={32} color="#b8975a" />
                  <Text style={styles.uploadDottedBoxTitle}>
                    {selectedFile ? selectedFile.name : "اضغط لاختيار ملف PDF من الجهاز"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={[styles.roundedGrayInput, { height: 120, textAlignVertical: "top" }]}
                  placeholder="اكتب الصيغة القانونية هنا..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={rawTextInput}
                  onChangeText={setRawTextInput}
                />
              )}

              <TouchableOpacity
                style={[styles.saveAndExportBtn, { marginTop: 16 }]}
                onPress={handleCreateTemplate}
                disabled={submittingTemplate}
              >
                {submittingTemplate ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveAndExportBtnText}>تحويل وحفظ القالب</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // Top Dark Office Bar (Matching Image 1 & 2)
  topOfficeBar: {
    backgroundColor: "#0d1b2a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  topOfficeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  topOfficeSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
    textAlign: "center",
  },

  // Screen Header (Matching Image 1 & 2)
  screenHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  screenTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  headerIconButton: {
    padding: 6,
  },

  // 5-Step Stepper (Matching Image 1 & 2)
  stepperContainer: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#ffffff",
    position: "relative",
  },
  stepperLine: {
    position: "absolute",
    top: 26,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: "#b8975a",
    zIndex: 1,
  },
  stepperStepsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    zIndex: 2,
  },
  stepItem: {
    alignItems: "center",
    width: 60,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleCompleted: {
    backgroundColor: "#0e2038",
    borderColor: "#0e2038",
  },
  stepCircleActive: {
    backgroundColor: "#0e2038",
    borderColor: "#b8975a",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
  },
  stepNumberTextActive: {
    color: "#ffffff",
  },
  stepLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    textAlign: "center",
  },
  stepLabelActive: {
    color: "#0e2038",
    fontWeight: "700",
  },

  // Common Layout
  contentPadding: {
    padding: 16,
    paddingBottom: 40,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0e2038",
    textAlign: "right",
    marginBottom: 4,
  },
  stepSubheading: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "right",
    marginBottom: 16,
  },

  // Step 1 Template Type Cards
  typeCardsContainer: {
    gap: 14,
  },
  typeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  typeCardSelected: {
    borderColor: "#b8975a",
    backgroundColor: "#fcfaf6",
  },
  typeCardTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#0e2038",
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeApp: {
    backgroundColor: "#eff6ff",
  },
  typeBadgePersonal: {
    backgroundColor: "#fef3c7",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  typeBadgeTextApp: {
    color: "#1d4ed8",
  },
  typeBadgeTextPersonal: {
    color: "#b45309",
  },
  typeTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0e2038",
    textAlign: "right",
    marginBottom: 6,
  },
  typeDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "right",
    lineHeight: 20,
    marginBottom: 14,
  },
  typeCardFooter: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  typeCountChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  typeCountChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0e2038",
  },
  typeActionBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  typeActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0e2038",
  },

  // Step 2 Template List
  templateSearchRow: {
    flexDirection: "row-reverse",
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row-reverse",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
    textAlign: "right",
    fontSize: 14,
    color: "#0e2038",
  },
  addTemplateSmallBtn: {
    backgroundColor: "#0e2038",
    borderWidth: 1,
    borderColor: "#b8975a",
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeTabsContainer: {
    flexDirection: "row-reverse",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  scopeTabBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  scopeTabBtnActive: {
    backgroundColor: "#0e2038",
  },
  scopeTabBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  scopeTabBtnTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  templateCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  templateCardRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  templateIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#fcf9f2",
    borderWidth: 1,
    borderColor: "#f5ede0",
    alignItems: "center",
    justifyContent: "center",
  },
  templateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0e2038",
    textAlign: "right",
  },
  templateMetaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  templateMeta: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "right",
  },
  templateScopeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  templateScopeBadgeApp: {
    backgroundColor: "#eff6ff",
  },
  templateScopeBadgePersonal: {
    backgroundColor: "#fef3c7",
  },
  templateScopeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  templateScopeBadgeTextApp: {
    color: "#1d4ed8",
  },
  templateScopeBadgeTextPersonal: {
    color: "#b45309",
  },
  deleteTemplateBtn: {
    padding: 6,
    marginLeft: 4,
  },

  // Step 3 Source Cards
  sourceCard: {
    flexDirection: "row-reverse",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  sourceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0e2038",
    alignItems: "center",
    justifyContent: "center",
  },
  sourceCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0e2038",
    textAlign: "right",
  },
  sourceCardDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    textAlign: "right",
    lineHeight: 18,
  },

  // Step 4 Form Layout (Matching Image 1)
  formSectionBox: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 8,
  },
  verticalBlueBar: {
    width: 3.5,
    height: 16,
    backgroundColor: "#b8975a",
    borderRadius: 2,
    marginLeft: 6,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0e2038",
    textAlign: "right",
  },
  fieldLabelStandalone: {
    fontSize: 13,
    color: "#0e2038",
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 6,
  },
  roundedGrayInput: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0e2038",
    textAlign: "right",
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputFocused: {
    borderColor: "#b8975a",
    backgroundColor: "#ffffff",
  },

  // Inset Label Container (Matching Image 1)
  insetInputContainer: {
    position: "relative",
    borderWidth: 1.5,
    borderColor: "#0e2038",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    marginBottom: 10,
  },
  insetInputContainerFocused: {
    borderColor: "#b8975a",
    backgroundColor: "#ffffff",
  },
  insetInputLabel: {
    position: "absolute",
    top: -9,
    right: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    fontSize: 11,
    fontWeight: "bold",
    color: "#0e2038",
  },
  insetTextInput: {
    fontSize: 15,
    color: "#0e2038",
    textAlign: "right",
    paddingVertical: 4,
  },

  // Step 4 Logo Picker Layout
  fieldLabelRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  fieldLabelOptional: {
    fontSize: 11,
    color: "#64748b",
  },
  logoUploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#b8975a",
    backgroundColor: "#fcfaf6",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoUploadIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5ede0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoUploadTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0e2038",
    marginBottom: 4,
  },
  logoUploadSubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  logoSelectedCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#b8975a",
    borderRadius: 12,
    padding: 12,
  },
  logoPreviewImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  logoDetailsWrap: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "flex-end",
  },
  logoFileName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0e2038",
    textAlign: "right",
  },
  logoFileStatus: {
    fontSize: 11,
    color: "#16a34a",
    marginTop: 2,
    fontWeight: "600",
  },
  logoActionsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  logoChangeBtn: {
    backgroundColor: "#0e2038",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoChangeBtnText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  logoRemoveBtn: {
    padding: 6,
  },

  // Bottom Buttons
  bottomNavButtonsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  navNextBtn: {
    flex: 1,
    backgroundColor: "#0e2038",
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navNextBtnText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
  },
  navPrevBtn: {
    width: 90,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navPrevBtnText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
  },

  // Step 5 Preview (Matching Image 2)
  previewScrollContent: {
    padding: 14,
    paddingBottom: 50,
  },
  docOfficeHeaderCard: {
    backgroundColor: "#ffffff",
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#b8975a",
    marginBottom: 12,
  },
  docOfficeHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  docOfficeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fcf9f2",
    borderWidth: 1,
    borderColor: "#f5ede0",
    alignItems: "center",
    justifyContent: "center",
  },
  docOfficeTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0e2038",
    textAlign: "right",
  },
  docOfficeAddress: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    textAlign: "right",
  },
  docOfficePhone: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
    textAlign: "right",
  },

  // Edit Action Row (Matching Image 2)
  editActionHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  editTextPillBtn: {
    backgroundColor: "#0e2038",
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  editTextPillBtnActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  editTextPillBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ffffff",
  },
  editHintRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  editHintText: {
    fontSize: 12,
    color: "#475569",
  },

  // A4 Paper Sheet (Matching Image 2)
  a4PaperSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    minHeight: 420,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderTopWidth: 4,
    borderTopColor: "#b8975a",
    shadowColor: "#0e2038",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  paperInnerRow: {
    flexDirection: "row-reverse",
    gap: 14,
  },
  paperMainColumn: {
    flex: 1,
  },
  legalBodyParagraph: {
    fontSize: 14,
    color: "#1e293b",
    textAlign: "right",
    lineHeight: 25,
  },
  paperMarginalColumn: {
    width: 90,
    alignItems: "center",
    borderRightWidth: 1.5,
    borderRightColor: "#f5ede0",
    paddingRight: 8,
  },
  marginalDivider: {
    width: "80%",
    height: 1.5,
    backgroundColor: "#b8975a",
    marginVertical: 10,
  },
  marginalSubjectHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0e2038",
    textAlign: "center",
  },
  marginalSubjectTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#b8975a",
    textAlign: "center",
    marginTop: 4,
  },
  marginalLawyerNote: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 14,
  },

  editableDocumentInput: {
    fontSize: 14,
    color: "#0e2038",
    textAlign: "right",
    lineHeight: 25,
    minHeight: 300,
  },

  // Step 5 Actions
  previewActionFooter: {
    marginTop: 18,
    gap: 10,
  },
  saveAndExportBtn: {
    backgroundColor: "#0e2038",
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveAndExportBtnText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
  },
  backToEditInputsBtn: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  backToEditInputsBtnText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  btnRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  caseModalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 12,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0e2038",
  },
  modalCloseBtn: {
    padding: 4,
  },
  caseItemCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  caseItemHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  caseItemNumber: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0e2038",
  },
  caseItemCourt: {
    fontSize: 12,
    color: "#64748b",
  },
  caseItemParties: {
    fontSize: 12,
    color: "#334155",
    textAlign: "right",
  },

  // Success Modal
  successModalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0e2038",
    borderWidth: 2,
    borderColor: "#b8975a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successTitleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0e2038",
    marginBottom: 6,
  },
  successSubtitleText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  viewPdfSuccessBtn: {
    backgroundColor: "#0e2038",
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    width: "100%",
    justifyContent: "center",
    marginBottom: 10,
  },
  viewPdfSuccessBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  closeSuccessBtn: {
    paddingVertical: 10,
  },
  closeSuccessBtnText: {
    fontSize: 13,
    color: "#64748b",
  },

  // Helpers
  centerContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0e2038",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  primaryActionBtn: {
    backgroundColor: "#0e2038",
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ffffff",
  },
  createTabRow: {
    flexDirection: "row-reverse",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 3,
    marginVertical: 12,
  },
  createTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  createTabBtnActive: {
    backgroundColor: "#ffffff",
  },
  createTabBtnText: {
    fontSize: 12,
    color: "#64748b",
  },
  createTabBtnTextActive: {
    color: "#0e2038",
    fontWeight: "bold",
  },
  uploadDottedBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#b8975a",
    backgroundColor: "#fcf9f2",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadDottedBoxTitle: {
    fontSize: 13,
    color: "#0e2038",
    marginTop: 8,
    fontWeight: "600",
  },
});
