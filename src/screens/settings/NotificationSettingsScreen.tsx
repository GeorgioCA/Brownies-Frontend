import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../types';
import { getPreferences, updateNotificationSettings } from '../../api/preferences';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'NotificationSettings'>;

export default function NotificationSettingsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPreferences();
        const data = res.data;
        setShowOnlineStatus(data.show_online_status ?? true);
        setShowDistance(data.show_distance ?? true);
      } catch {
        Alert.alert('Error', 'Failed to load notification settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = useCallback(
    async (key: 'show_online_status' | 'show_distance', value: boolean) => {
      setSaving(key);
      try {
        const payload = {
          show_online_status: key === 'show_online_status' ? value : showOnlineStatus,
          show_distance: key === 'show_distance' ? value : showDistance,
        };
        await updateNotificationSettings(payload);

        if (key === 'show_online_status') {
          setShowOnlineStatus(value);
        } else {
          setShowDistance(value);
        }
      } catch {
        Alert.alert('Error', 'Failed to update setting. Please try again.');
      } finally {
        setSaving(null);
      }
    },
    [showOnlineStatus, showDistance],
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading settings..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Show Online Status</Text>
              <Text style={styles.rowDescription}>
                Allow others to see when you're online
              </Text>
            </View>
            <Switch
              value={showOnlineStatus}
              onValueChange={(val) => handleToggle('show_online_status', val)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={showOnlineStatus ? colors.primary : colors.white}
              disabled={saving === 'show_online_status'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Show Distance</Text>
              <Text style={styles.rowDescription}>
                Allow others to see your approximate distance
              </Text>
            </View>
            <Switch
              value={showDistance}
              onValueChange={(val) => handleToggle('show_distance', val)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={showDistance ? colors.primary : colors.white}
              disabled={saving === 'show_distance'}
            />
          </View>
        </View>

        <Text style={styles.footerNote}>
          Changes are saved automatically.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  headerPlaceholder: {
    width: 60,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 60,
  },
  rowTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  rowDescription: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  footerNote: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
});
