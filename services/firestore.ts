import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';

import app from '../firebase';

const db = getFirestore(app);

const FREE_DAILY_ANALYSIS_LIMIT = 0;

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export async function saveMeal(data: any) {
  const docRef = await addDoc(collection(db, 'meals'), data);
  return docRef.id;
}

export async function getMealsByUser(userId: string) {
  const q = query(collection(db, 'meals'), where('userId', '==', userId));

  const snapshot = await getDocs(q);

  const meals: any[] = [];

  snapshot.forEach((docItem) => {
    meals.push({
      id: docItem.id,
      ...docItem.data(),
    });
  });

  return meals;
}

export async function getTodayNutrition(userId: string) {
  const meals = await getMealsByUser(userId);

  const today = new Date().toDateString();

  const todayMeals = meals.filter((meal: any) => {
    if (!meal.createdAt) return false;

    if (meal.createdAt?.seconds) {
      return new Date(meal.createdAt.seconds * 1000).toDateString() === today;
    }

    if (meal.createdAt?.toDate) {
      return meal.createdAt.toDate().toDateString() === today;
    }

    return new Date(meal.createdAt).toDateString() === today;
  });

  let totalCalories = 0;
  let totalProteins = 0;

  todayMeals.forEach((meal: any) => {
    totalCalories += Number(meal.calorias || meal.calorias_total || 0);
    totalProteins += Number(meal.proteinas || meal.proteinas_total || 0);
  });

  return {
    meals: todayMeals,
    totalCalories,
    totalProteins,
  };
}

export async function saveUserGoals(userId: string, data: any) {
  await setDoc(doc(db, 'users', userId), data, { merge: true });
}

export async function getUserGoals(userId: string) {
  const snapshot = await getDoc(doc(db, 'users', userId));

  if (!snapshot.exists()) {
    return {
      calorieGoal: 2500,
      proteinGoal: 180,
      plan: 'free',
      dailyAnalysisCount: 0,
      dailyAnalysisDate: getTodayKey(),
      onboardingCompleted: false,
    };
  }

  const data = snapshot.data();

  return {
    calorieGoal: data.calorieGoal || 2500,
    proteinGoal: data.proteinGoal || 180,
    plan: data.plan || 'free',
    dailyAnalysisCount: data.dailyAnalysisCount || 0,
    dailyAnalysisDate: data.dailyAnalysisDate || getTodayKey(),
    onboardingCompleted: data.onboardingCompleted || false,
    weight: data.weight || null,
    height: data.height || null,
    objective: data.objective || null,
    activityLevel: data.activityLevel || null,
    ...data,
  };
}

export async function canUserAnalyzeToday(userId: string) {
  const profile = await getUserGoals(userId);

  const todayKey = getTodayKey();
  const plan = profile?.plan || 'free';

  if (plan === 'premium') {
    return {
      allowed: true,
      plan,
      count: 0,
      limit: null,
      remaining: null,
    };
  }

  const savedDate = profile?.dailyAnalysisDate || todayKey;

  const currentCount =
    savedDate === todayKey ? Number(profile?.dailyAnalysisCount || 0) : 0;

  const remaining = Math.max(FREE_DAILY_ANALYSIS_LIMIT - currentCount, 0);

  return {
    allowed: false,
    plan,
    count: currentCount,
    limit: FREE_DAILY_ANALYSIS_LIMIT,
    remaining,
  };
}

export async function incrementDailyAnalysisCount(userId: string) {
  const profile = await getUserGoals(userId);

  const todayKey = getTodayKey();
  const savedDate = profile?.dailyAnalysisDate || todayKey;

  const currentCount =
    savedDate === todayKey ? Number(profile?.dailyAnalysisCount || 0) : 0;

  const nextCount = currentCount + 1;

  await setDoc(
    doc(db, 'users', userId),
    {
      dailyAnalysisCount: nextCount,
      dailyAnalysisDate: todayKey,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return nextCount;
}

export async function activatePremiumMock(userId: string) {
  await setDoc(
    doc(db, 'users', userId),
    {
      plan: 'premium',
      premiumActivatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function deactivatePremiumMock(userId: string) {
  await setDoc(
    doc(db, 'users', userId),
    {
      plan: 'free',
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}