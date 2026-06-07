import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createCase } from "../database";
import { caseSchema } from "../validation/caseSchema";

export default function CreateCase() {
  const [caseDetails, setCaseDetails] = useState({
    case_number: "",
    case_year: "",
    client_name: "",
    client_opponent_name: "",
    client_role: "",
    client_opponent_role: "",
    client_national_id: "",
    client_opponent_national_id: "",
    latest_court_session_date: "",
    next_court_session_date: "",
    case_status: "",
    case_notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [latestDate, setLatestDate] = useState(new Date());
  const [nextDate, setNextDate] = useState(new Date());

  const [showLatest, setShowLatest] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const handleChange = (key: string, value: string) => {
    setCaseDetails((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const handleSubmit = async () => {
    const validationResult = caseSchema.safeParse(caseDetails);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};

      validationResult.error.issues.forEach((error) => {
        const field = error.path[0] as string;

        if (!fieldErrors[field]) {
          fieldErrors[field] = error.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      const res = await createCase(validationResult.data);
      console.log(res);

      // Optional reset
      setCaseDetails({
        case_number: "",
        case_year: "",
        client_name: "",
        client_opponent_name: "",
        client_role: "",
        client_opponent_role: "",
        client_national_id: "",
        client_opponent_national_id: "",
        latest_court_session_date: "",
        next_court_session_date: "",
        case_status: "",
        case_notes: "",
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>إضافة قضية جديدة</Text>

      <TextInput
        placeholder="رقم القضية"
        placeholderTextColor="#999"
        style={styles.input}
        keyboardType="numeric"
        value={caseDetails.case_number}
        onChangeText={(text) => handleChange("case_number", text)}
      />
      {errors.case_number && (
        <Text style={styles.errorText}>{errors.case_number}</Text>
      )}

      <TextInput
        placeholder="سنة القضية"
        placeholderTextColor="#999"
        style={styles.input}
        keyboardType="numeric"
        value={caseDetails.case_year}
        onChangeText={(text) => handleChange("case_year", text)}
      />
      {errors.case_year && (
        <Text style={styles.errorText}>{errors.case_year}</Text>
      )}

      <TextInput
        placeholder="اسم الموكل"
        placeholderTextColor="#999"
        style={styles.input}
        value={caseDetails.client_name}
        onChangeText={(text) => handleChange("client_name", text)}
      />
      {errors.client_name && (
        <Text style={styles.errorText}>{errors.client_name}</Text>
      )}

      <TextInput
        placeholder="اسم الخصم"
        placeholderTextColor="#999"
        style={styles.input}
        value={caseDetails.client_opponent_name}
        onChangeText={(text) => handleChange("client_opponent_name", text)}
      />
      {errors.client_opponent_name && (
        <Text style={styles.errorText}>{errors.client_opponent_name}</Text>
      )}

      <View style={styles.picker}>
        <Picker
          selectedValue={caseDetails.client_role}
          onValueChange={(value) => handleChange("client_role", value)}
          style={{ direction: "rtl" }}
        >
          <Picker.Item label="اختر صفة الموكل" value="" />
          <Picker.Item label="مدعي" value="مدعي" />
          <Picker.Item label="مدعي عليه" value="مدعي عليه" />
        </Picker>

        {errors.client_role && (
          <Text style={styles.errorText}>{errors.client_role}</Text>
        )}
      </View>

      <View style={styles.picker}>
        <Picker
          selectedValue={caseDetails.client_opponent_role}
          onValueChange={(value) => handleChange("client_opponent_role", value)}
          style={{ direction: "rtl" }}
        >
          <Picker.Item label="اختر صفة الخصم" value="" />
          <Picker.Item label="مدعي" value="مدعي" />
          <Picker.Item label="مدعي عليه" value="مدعي عليه" />
        </Picker>

        {errors.client_opponent_role && (
          <Text style={styles.errorText}>{errors.client_opponent_role}</Text>
        )}
      </View>

      <TextInput
        placeholder="الرقم القومي للموكل"
        placeholderTextColor="#999"
        keyboardType="numeric"
        style={styles.input}
        value={caseDetails.client_national_id}
        onChangeText={(text) => handleChange("client_national_id", text)}
      />
      {errors.client_national_id && (
        <Text style={styles.errorText}>{errors.client_national_id}</Text>
      )}

      <TextInput
        placeholder="الرقم القومي للخصم"
        placeholderTextColor="#999"
        keyboardType="numeric"
        style={styles.input}
        value={caseDetails.client_opponent_national_id}
        onChangeText={(text) =>
          handleChange("client_opponent_national_id", text)
        }
      />
      {errors.client_opponent_national_id && (
        <Text style={styles.errorText}>
          {errors.client_opponent_national_id}
        </Text>
      )}

      {showLatest && (
        <DateTimePicker
          value={latestDate}
          mode="date"
          is24Hour
          onChange={(event, selectedDate) => {
            setShowLatest(false);

            if (selectedDate) {
              setLatestDate(selectedDate);

              handleChange(
                "latest_court_session_date",
                selectedDate.toISOString().split("T")[0],
              );
            }
          }}
        />
      )}

      <Pressable style={styles.input} onPress={() => setShowLatest(true)}>
        <Text
          style={{
            color: caseDetails.latest_court_session_date ? "#000" : "#999",
            fontSize: 16,
            textAlign: "right",
          }}
        >
          {caseDetails.latest_court_session_date || "تاريخ الجلسة الماضية"}
        </Text>
      </Pressable>

      {errors.latest_court_session_date && (
        <Text style={styles.errorText}>{errors.latest_court_session_date}</Text>
      )}

      {showNext && (
        <DateTimePicker
          value={nextDate}
          mode="date"
          is24Hour
          onChange={(event, selectedDate) => {
            setShowNext(false);

            if (selectedDate) {
              setNextDate(selectedDate);

              handleChange(
                "next_court_session_date",
                selectedDate.toISOString().split("T")[0],
              );
            }
          }}
        />
      )}

      <Pressable style={styles.input} onPress={() => setShowNext(true)}>
        <Text
          style={{
            color: caseDetails.next_court_session_date ? "#000" : "#999",
            fontSize: 16,
            textAlign: "right",
          }}
        >
          {caseDetails.next_court_session_date || "تاريخ الجلسة القادمة"}
        </Text>
      </Pressable>

      {errors.next_court_session_date && (
        <Text style={styles.errorText}>{errors.next_court_session_date}</Text>
      )}

      <TextInput
        placeholder="حالة القضية"
        placeholderTextColor="#999"
        style={styles.input}
        value={caseDetails.case_status}
        onChangeText={(text) => handleChange("case_status", text)}
      />
      {errors.case_status && (
        <Text style={styles.errorText}>{errors.case_status}</Text>
      )}

      <TextInput
        placeholder="ملاحظات القضية"
        placeholderTextColor="#999"
        style={[styles.input, styles.notesInput]}
        multiline
        numberOfLines={4}
        value={caseDetails.case_notes}
        onChangeText={(text) => handleChange("case_notes", text)}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>إضافة القضية</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 30,
  },

  input: {
    color: "#3c3c3c",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    textAlign: "right",
  },

  picker: {
    height: 60,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    color: "#3c3c3c",
    direction: "rtl",
    textAlign: "right",
  },

  label: {
    textAlign: "right",
    fontWeight: "600",
    color: "#444",
  },

  errorText: {
    color: "red",
    textAlign: "right",
    fontSize: 12,
    marginTop: -10,
  },

  notesInput: {
    height: 120,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
