import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList, Plan, Subscription } from '../../types';
import { getPlans, getMySubscription, createOrder, verifyPayment, cancelSubscription } from '../../api/subscriptions';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Premium'>;

const PREMIUM_FEATURES = [
  { icon: '❤️', label: 'Unlimited Likes' },
  { icon: '👁️', label: 'See Who Liked You' },
  { icon: '🔍', label: 'Advanced Filters' },
  { icon: '⭐', label: 'Priority Support' },
  { icon: '🚫', label: 'No Ads' },
];

export default function PremiumScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<{
    order_id: string;
    plan_id: string;
    plan_name: string;
    amount: number;
    currency: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [plansRes, subRes] = await Promise.all([getPlans(), getMySubscription()]);
      setPlans(plansRes.data);
      setSubscription(subRes.data ?? null);
    } catch {
      Alert.alert('Error', 'Failed to load subscription data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubscribe = useCallback(async (plan: Plan) => {
    setSubscribingPlanId(plan.id);
    try {
      const res = await createOrder(plan.id);
      const order = res.data;
      setCurrentOrder({
        order_id: order.order_id,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: order.amount,
        currency: order.currency,
      });

      Alert.alert(
        'Order Created',
        `Plan: ${plan.name}\nAmount: ${(order.amount / 100).toFixed(2)} ${order.currency.toUpperCase()}\nOrder ID: ${order.order_id}\n\nIn production, this would open the Razorpay payment sheet. For now, use the "Verify Payment" button to simulate a successful payment.`,
        [
          { text: 'OK' },
          {
            text: 'Verify Payment',
            onPress: async () => {
              setVerifying(true);
              try {
                const mockPaymentId = `pay_mock_${Date.now()}`;
                const mockSignature = `sig_mock_${Date.now()}`;
                await verifyPayment({
                  razorpay_order_id: order.order_id,
                  razorpay_payment_id: mockPaymentId,
                  razorpay_signature: mockSignature,
                });
                setCurrentOrder(null);
                await loadData();
                Alert.alert('Success', 'Payment verified! Your premium subscription is now active.');
              } catch {
                Alert.alert('Payment Failed', 'Payment verification failed. Please try again.');
              } finally {
                setVerifying(false);
              }
            },
          },
        ],
      );
    } catch {
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setSubscribingPlanId(null);
    }
  }, [loadData]);

  const handleCancelSubscription = useCallback(async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription? You will still have access until the end of your billing period.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelSubscription();
              await loadData();
              Alert.alert('Cancelled', 'Your subscription has been cancelled.');
            } catch {
              Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }, [loadData]);

  const handleVerifyCurrentOrder = useCallback(async () => {
    if (!currentOrder) return;
    setVerifying(true);
    try {
      const mockPaymentId = `pay_mock_${Date.now()}`;
      const mockSignature = `sig_mock_${Date.now()}`;
      await verifyPayment({
        razorpay_order_id: currentOrder.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });
      setCurrentOrder(null);
      await loadData();
      Alert.alert('Success', 'Payment verified! Your premium subscription is now active.');
    } catch {
      Alert.alert('Payment Failed', 'Payment verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }, [currentOrder, loadData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading plans..." />;
  }

  const isActive = subscription?.status === 'active';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Go Premium</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.heroTitle}>Unlock Premium Features</Text>
          <Text style={styles.heroSubtitle}>
            Get the most out of Brownies with premium access
          </Text>
        </View>

        {currentOrder && (
          <View style={styles.orderBanner}>
            <Text style={styles.orderTitle}>Pending Payment</Text>
            <Text style={styles.orderDetail}>
              Plan: {currentOrder.plan_name}
            </Text>
            <Text style={styles.orderDetail}>
              Amount: {(currentOrder.amount / 100).toFixed(2)} {currentOrder.currency.toUpperCase()}
            </Text>
            <Text style={styles.orderDetail}>
              Order ID: {currentOrder.order_id}
            </Text>
            <Button
              title="Verify Payment"
              onPress={handleVerifyCurrentOrder}
              variant="primary"
              size="sm"
              loading={verifying}
              style={styles.verifyButton}
            />
          </View>
        )}

        {isActive && subscription && (
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusIcon}>✅</Text>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>You are a Premium member!</Text>
                <Text style={styles.statusPlan}>
                  Plan: {plans.find((p) => p.id === subscription.plan_id)?.name ?? subscription.plan_id}
                </Text>
                <Text style={styles.statusDate}>
                  Expires: {formatDate(subscription.end_date)}
                </Text>
              </View>
            </View>
            <Button
              title="Cancel Subscription"
              onPress={handleCancelSubscription}
              variant="outline"
              size="sm"
              loading={cancelling}
              style={styles.cancelButton}
            />
          </View>
        )}

        {!isActive && (
          <>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {plans.map((plan) => {
              const isRecommended = plan.duration_days >= 365;
              return (
                <View key={plan.id} style={[styles.planCard, isRecommended && styles.planCardRecommended]}>
                  {isRecommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Best Value</Text>
                    </View>
                  )}
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}>
                      ₹{(plan.price / 100).toFixed(0)}
                    </Text>
                    <Text style={styles.planPeriod}>
                      / {plan.duration_days} days
                    </Text>
                  </View>
                  <View style={styles.planFeaturesContainer}>
                    {plan.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Text style={styles.featureBullet}>•</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  <Button
                    title="Subscribe"
                    onPress={() => handleSubscribe(plan)}
                    variant={isRecommended ? 'primary' : 'outline'}
                    size="md"
                    loading={subscribingPlanId === plan.id}
                    disabled={subscribingPlanId !== null}
                  />
                </View>
              );
            })}

            {plans.length === 0 && (
              <Text style={styles.emptyText}>No plans available at the moment.</Text>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Premium Features</Text>
        <View style={styles.featuresGrid}>
          {PREMIUM_FEATURES.map((feature, idx) => (
            <View key={idx} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>

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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  crown: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  orderBanner: {
    backgroundColor: colors.goldLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  orderTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  orderDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  verifyButton: {
    marginTop: spacing.md,
  },

  statusCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    ...shadow.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statusIcon: {
    fontSize: 28,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statusPlan: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusDate: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  planCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },
  planCardRecommended: {
    borderColor: colors.gold,
    borderWidth: 2,
    ...shadow.md,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: colors.gold,
    borderBottomLeftRadius: radius.sm,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  recommendedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  planName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  planPrice: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  planPeriod: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  planFeaturesContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  featureBullet: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  featureText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    flex: 1,
  },

  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  featureLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
});
