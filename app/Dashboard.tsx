import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOfficeCases } from "./api/cases";
import { getOfficeTasks, Task } from "./api/tasks";
import DashboardCalendar, {
  formatDueDate,
  isSameDay
} from "./components/DashboardCalendar";
import { CaseT } from "./types";
import { useUserStore } from "./zustandStore/userStore";

export default function Dashboard() {
  const currentOffice = useUserStore((state) => state.Office);
  const user = useUserStore.getState().user;
  const [cases, setCases] = useState<CaseT[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!currentOffice) {
        router.replace("/Choice" as never);
        return;
      }
      setLoading(true);
      Promise.all([
        getOfficeTasks(currentOffice.id).catch(() => []),
        getOfficeCases(currentOffice.id).catch(() => []),
      ])
        .then(([officeTasks, officeCases]) => {
          setTasks(officeTasks);
          setCases(officeCases);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [currentOffice])
  );

  if (!currentOffice) return null;

  const filteredTasks = (
    selectedDate
      ? tasks.filter((task) => isSameDay(task.due_date, selectedDate))
      : tasks
  )
    .slice()
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

  const filteredCases = (
    selectedDate
      ? cases.filter((c) => isSameDay(c.next_court_session_date, selectedDate))
      : cases.filter((c) => Boolean(c.next_court_session_date))
  )
    .slice()
    .sort((a, b) => {
      if (!a.next_court_session_date) return 1;
      if (!b.next_court_session_date) return -1;
      return a.next_court_session_date.localeCompare(b.next_court_session_date);
    });

  const hasItems = filteredTasks.length > 0 || filteredCases.length > 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark Navy Header with curved bottom */}
        <View style={styles.darkHeader}>
          <SafeAreaView edges={["top", "left", "right"]}>
            <View style={styles.topNav}>
              <TouchableOpacity
                style={styles.officeSwitcher}
                onPress={() => router.replace("/Choice" as never)}
              >
                <Feather name="home" size={18} color="#b89355" />
                <Text style={styles.officeSwitcherText}>الرئيسية</Text>
              </TouchableOpacity>

              <View style={styles.quickMenu}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setIsQuickMenuOpen((isOpen) => !isOpen)}
                  accessibilityLabel="الروابط السريعة"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isQuickMenuOpen }}
                >
                  <Feather
                    name={isQuickMenuOpen ? "x" : "menu"}
                    size={20}
                    color="#ffffff"
                  />
                </TouchableOpacity>

                {isQuickMenuOpen && (
                  <View style={styles.quickMenuList}>
                    <TouchableOpacity
                      style={styles.menuLink}
                      onPress={() => router.push("/workspace/Cases" as never)}
                    >
                      <Feather name="briefcase" size={17} color="#b89355" />
                      <Text style={styles.menuLinkText}>القضايا</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={styles.menuLink}
                      onPress={() => router.push("/workspace/Tasks" as never)}
                    >
                      <Feather name="check-square" size={17} color="#b89355" />
                      <Text style={styles.menuLinkText}>الأعمال الإدارية</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={styles.menuLink}
                      onPress={() =>
                        router.push("/workspace/OfficeSettings" as never)
                      }
                    >
                      <Feather name="sliders" size={17} color="#b89355" />
                      <Text style={styles.menuLinkText}>الإعدادات</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.office}>● {currentOffice.name}</Text>
            <Text style={styles.title}>مرحباً، {user?.name.split(" ")[0]}</Text>
            <Text style={styles.subtitle}>مساحة عملك اليومية</Text>
          </SafeAreaView>
        </View>

        {/* Overlapping Main Content */}
        <View style={styles.mainContainer}>
          <DashboardCalendar
            tasks={tasks}
            cases={cases}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <TouchableOpacity
                style={styles.panelAction}
                onPress={() => router.push("/workspace/Tasks" as never)}
              >
                <Feather name="chevron-left" size={15} color="#b89355" />
                <Text style={styles.panelActionText}>الأعمال الإدارية</Text>
              </TouchableOpacity>
              <View style={styles.panelHeaderTitle}>
                <Feather name="clipboard" size={18} color="#b89355" />
                <Text style={styles.panelTitle}>قائمة العمل اليوم</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#b89355" size="small" />
                <Text style={styles.loadingText}>جارِ التحميل...</Text>
              </View>
            ) : !hasItems ? (
              <View style={styles.emptyContainer}>
                <Feather name="calendar" size={32} color="#94a3b8" />
                <Text style={styles.emptyText}>لا يوجد أعمال أو قضايا</Text>
              </View>
            ) : (
              <View style={styles.contentList}>
                {/* Court Sessions */}
                {filteredCases.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                      <TouchableOpacity
                        style={styles.sectionAction}
                        onPress={() => router.push("/workspace/Cases" as never)}
                      >
                        <Feather name="chevron-left" size={14} color="#b89355" />
                        <Text style={styles.sectionActionText}>كل القضايا</Text>
                      </TouchableOpacity>
                      <View style={styles.sectionTitleGroup}>
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>
                            {filteredCases.length}
                          </Text>
                        </View>
                        <Text style={styles.sectionTitle}>جلسات المحكمة</Text>
                        <Feather name="briefcase" size={16} color="#b89355" />
                      </View>
                    </View>

                    <View style={styles.cardsList}>
                      {filteredCases.map((c) => {
                        const formattedSessionDate = formatDueDate(
                          c.next_court_session_date,
                        );
                        return (
                          <TouchableOpacity
                            key={c.id || c.case_number}
                            style={styles.caseCard}
                            onPress={() =>
                              c.id
                                ? router.push({
                                    pathname: "/CaseDetails",
                                    params: { caseId: c.id },
                                  } as never)
                                : router.push("/workspace/Cases" as never)
                            }
                            activeOpacity={0.7}
                          >
                            <View style={styles.cardTop}>
                              <View style={styles.caseTag}>
                                <Text style={styles.caseTagText}>
                                  جلسة محكمة
                                </Text>
                                <Feather
                                  name="briefcase"
                                  size={11}
                                  color="#0284c7"
                                />
                              </View>
                              <Text
                                style={styles.caseCardTitle}
                                numberOfLines={1}
                              >
                                {c.title || `قضية رقم ${c.case_number}`}
                              </Text>
                            </View>

                            <View style={styles.caseMetaRow}>
                              <Text style={styles.caseMetaText}>
                                رقم: {c.case_number} / {c.case_year}
                              </Text>
                              {c.client_name ? (
                                <Text style={styles.caseMetaText}>
                                  الموكل: {c.client_name}
                                </Text>
                              ) : null}
                            </View>

                            <View style={styles.cardBottom}>
                              <Feather
                                name="chevron-left"
                                size={15}
                                color="#94a3b8"
                              />
                              <View style={styles.badgesRow}>
                                {c.court_name ? (
                                  <View style={styles.courtNameBadge}>
                                    <Text
                                      style={styles.courtNameText}
                                      numberOfLines={1}
                                    >
                                      {c.court_name}
                                    </Text>
                                    <Feather
                                      name="map-pin"
                                      size={11}
                                      color="#64748b"
                                    />
                                  </View>
                                ) : null}
                                {formattedSessionDate ? (
                                  <View style={styles.caseDateBadge}>
                                    <Text style={styles.caseDateText}>
                                      {formattedSessionDate}
                                    </Text>
                                    <Feather
                                      name="calendar"
                                      size={12}
                                      color="#0284c7"
                                    />
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Administrative Tasks */}
                {filteredTasks.length > 0 && (
                  <View
                    style={[
                      styles.sectionBlock,
                      filteredCases.length > 0 && styles.sectionSpacing,
                    ]}
                  >
                    <View style={styles.sectionHeader}>
                      <TouchableOpacity
                        style={styles.sectionAction}
                        onPress={() => router.push("/workspace/Tasks" as never)}
                      >
                        <Feather name="chevron-left" size={14} color="#b89355" />
                        <Text style={styles.sectionActionText}>كل الأعمال</Text>
                      </TouchableOpacity>
                      <View style={styles.sectionTitleGroup}>
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>
                            {filteredTasks.length}
                          </Text>
                        </View>
                        <Text style={styles.sectionTitle}>الأعمال الإدارية</Text>
                        <Feather
                          name="check-square"
                          size={16}
                          color="#b89355"
                        />
                      </View>
                    </View>

                    <View style={styles.cardsList}>
                      {filteredTasks.map((task) => {
                        const formattedDate = formatDueDate(task.due_date);
                        return (
                          <TouchableOpacity
                            key={task.id}
                            style={styles.taskCard}
                            onPress={() =>
                              router.push("/workspace/Tasks" as never)
                            }
                            activeOpacity={0.7}
                          >
                            <View style={styles.cardTop}>
                              <View style={styles.taskTag}>
                                <Text style={styles.taskTagText}>عمل إداري</Text>
                              </View>
                              <Text
                                style={styles.taskCardTitle}
                                numberOfLines={1}
                              >
                                {task.title}
                              </Text>
                            </View>

                            <View style={styles.cardBottom}>
                              <Feather
                                name="chevron-left"
                                size={15}
                                color="#94a3b8"
                              />
                              {formattedDate ? (
                                <View style={styles.dueDateBadge}>
                                  <Text style={styles.dueDateText}>
                                    {formattedDate}
                                  </Text>
                                  <Feather
                                    name="calendar"
                                    size={12}
                                    color="#b89355"
                                  />
                                </View>
                              ) : (
                                <View style={styles.noDueDateBadge}>
                                  <Text style={styles.noDueDateText}>
                                    بدون تاريخ
                                  </Text>
                                  <Feather
                                    name="clock"
                                    size={11}
                                    color="#94a3b8"
                                  />
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  content: {
    paddingBottom: 40,
  },
  darkHeader: {
    backgroundColor: "#0d1b2a",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 48,
  },
  topNav: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 6,
  },
  officeSwitcher: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  officeSwitcherText: {
    color: "#b89355",
    fontSize: 14,
    fontWeight: "700",
  },
  office: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "right",
  },
  subtitle: {
    color: "#8da2b5",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "right",
  },
  mainContainer: {
    paddingHorizontal: 16,
    marginTop: -28,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#eef1f5",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    marginTop: 16,
    padding: 18,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  panelHeader: {
    alignItems: "center",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  panelHeaderTitle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  panelAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  panelActionText: {
    color: "#b89355",
    fontSize: 13,
    fontWeight: "700",
  },
  panelTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  filterBanner: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterBannerText: {
    color: "#1e293b",
    fontSize: 13,
    fontWeight: "600",
  },
  clearFilterBtn: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  clearFilterText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  fullResetBtn: {
    alignItems: "center",
    backgroundColor: "#0d1b2a",
    borderRadius: 12,
    flexDirection: "row",
    height: 48,
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 16,
    position: "relative",
  },
  resetBtnIcon: {
    left: 16,
    position: "absolute",
  },
  fullResetBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  contentList: {
    marginTop: 14,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionSpacing: {
    marginTop: 22,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitleGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  sectionTitle: {
    color: "#0e2038",
    fontSize: 15,
    fontWeight: "800",
  },
  countBadge: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
  },
  sectionAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  sectionActionText: {
    color: "#b89355",
    fontSize: 12,
    fontWeight: "700",
  },
  cardsList: {
    gap: 10,
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  cardBottom: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  caseCard: {
    backgroundColor: "#f0f7ff",
    borderColor: "#d0e3f7",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  caseTag: {
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    borderColor: "#bae6fd",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  caseTagText: {
    color: "#0369a1",
    fontSize: 11,
    fontWeight: "700",
  },
  caseCardTitle: {
    color: "#0e2038",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "right",
  },
  caseMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-end",
  },
  caseMetaText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },
  badgesRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  courtNameBadge: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    maxWidth: 160,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  courtNameText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },
  caseDateBadge: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#bae6fd",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  caseDateText: {
    color: "#0284c7",
    fontSize: 11,
    fontWeight: "700",
  },
  taskCard: {
    backgroundColor: "#f8fafc",
    borderColor: "#e8edf2",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  taskTag: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  taskTagText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },
  taskCardTitle: {
    color: "#0e2038",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "right",
  },
  dueDateBadge: {
    alignItems: "center",
    backgroundColor: "#fdf8ee",
    borderColor: "#faeed4",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dueDateText: {
    color: "#b89355",
    fontSize: 11,
    fontWeight: "700",
  },
  noDueDateBadge: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  noDueDateText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  quickMenu: {
    alignItems: "flex-end",
    position: "relative",
    zIndex: 2,
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: "#162840",
    borderColor: "#203a5c",
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  quickMenuList: {
    backgroundColor: "#0d1b2a",
    borderColor: "#203a5c",
    borderRadius: 12,
    borderWidth: 1,
    elevation: 8,
    padding: 6,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    top: 46,
    width: 155,
    zIndex: 9999,
  },
  menuLink: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  menuDivider: {
    backgroundColor: "#1d2e45",
    height: 1,
    marginHorizontal: 8,
  },
  menuLinkText: {
    color: "#f8fafc",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
});
