import React from "react";
import {
  ActivityIndicator,
  ImageBackground,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

type Props = {
  showIndicator?: boolean;
};

export default function LoadingScreen({ showIndicator = true }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <ImageBackground
        source={require("@/assets/images/Meezan-loading-screen.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        {showIndicator && (
          <View style={styles.indicatorContainer}>
            <ActivityIndicator size="large" color="#b8975a" />
          </View>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1b2a",
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  indicatorContainer: {
    paddingBottom: 60,
  },
});
