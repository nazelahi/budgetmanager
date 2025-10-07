import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface CurvedNavigationBackgroundProps {
  height?: number;
}

const CurvedNavigationBackground: React.FC<CurvedNavigationBackgroundProps> = ({
  height = 100,
}) => {
  const centerX = width / 2;
  const centerButtonRadius = 30;
  const curveDepth = 25;
  const topPadding = 15;
  
  // Create the curved path that matches the image better
  const path = `
    M 0 ${height - topPadding}
    Q 0 ${height - topPadding - 15} 15 ${height - topPadding - 15}
    L ${centerX - centerButtonRadius - 15} ${height - topPadding - 15}
    Q ${centerX - centerButtonRadius - 5} ${height - topPadding - 15} ${centerX - centerButtonRadius} ${height - topPadding - 20}
    Q ${centerX - centerButtonRadius} ${height - topPadding - curveDepth} ${centerX} ${height - topPadding - curveDepth}
    Q ${centerX + centerButtonRadius} ${height - topPadding - curveDepth} ${centerX + centerButtonRadius} ${height - topPadding - 20}
    Q ${centerX + centerButtonRadius + 5} ${height - topPadding - 15} ${centerX + centerButtonRadius + 15} ${height - topPadding - 15}
    L ${width - 15} ${height - topPadding - 15}
    Q ${width} ${height - topPadding - 15} ${width} ${height - topPadding}
    L ${width} ${height}
    L 0 ${height}
    Z
  `;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} style={styles.svg}>
        <Defs>
          <SvgLinearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1a1a1a" stopOpacity="1" />
            <Stop offset="25%" stopColor="#2d2d2d" stopOpacity="1" />
            <Stop offset="50%" stopColor="#1a1a1a" stopOpacity="1" />
            <Stop offset="75%" stopColor="#0f0f0f" stopOpacity="1" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={path}
          fill="url(#navGradient)"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default CurvedNavigationBackground;
