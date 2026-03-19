import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CirclePost {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
  likes: number;
  circleId: string;
}

export interface CircleStats {
  activeRidesToday: number;
  totalMembers: number;
  newMembersThisWeek: number;
  avgRating: number;
}

const MOCK_CIRCLE_POSTS: CirclePost[] = [
  {
    id: 'post_1',
    authorName: 'Ayesha M.',
    authorAvatar: '👩‍⚕️',
    content: 'Anyone going from F-10 to PIMS around 8 AM tomorrow?',
    timestamp: new Date(Date.now() - 3600000),
    likes: 3,
    circleId: 'pims-islamabad',
  },
  {
    id: 'post_2',
    authorName: 'Sara K.',
    authorAvatar: '👩‍🎓',
    content: 'Great carpool session today! We saved PKR 400 each.',
    timestamp: new Date(Date.now() - 7200000),
    likes: 8,
    circleId: 'nust-islamabad',
  },
  {
    id: 'post_3',
    authorName: 'Hina B.',
    authorAvatar: '🧕',
    content: 'New route from G-9 to UET now available 3 times daily!',
    timestamp: new Date(Date.now() - 86400000),
    likes: 12,
    circleId: 'uet-lahore',
  },
];

const CIRCLES_JOINED_KEY = 'circles_joined';

/**
 * Gets posts for a circle
 */
export async function getCirclePosts(circleId: string): Promise<CirclePost[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_CIRCLE_POSTS.filter(p => p.circleId === circleId);
}

/**
 * Gets stats for a circle
 */
export async function getCircleStats(circleId: string): Promise<CircleStats> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const statsMap: Record<string, CircleStats> = {
    'uet-lahore': { activeRidesToday: 48, totalMembers: 240, newMembersThisWeek: 12, avgRating: 4.8 },
    'pims-islamabad': { activeRidesToday: 35, totalMembers: 35, newMembersThisWeek: 2, avgRating: 4.9 },
    'comsats-islamabad': { activeRidesToday: 32, totalMembers: 180, newMembersThisWeek: 8, avgRating: 4.7 },
    'aga-khan-hospital': { activeRidesToday: 20, totalMembers: 55, newMembersThisWeek: 1, avgRating: 5.0 },
    'quaid-azam-university': { activeRidesToday: 60, totalMembers: 312, newMembersThisWeek: 18, avgRating: 4.6 },
    'nust-islamabad': { activeRidesToday: 75, totalMembers: 420, newMembersThisWeek: 25, avgRating: 4.8 },
  };

  return statsMap[circleId] || {
    activeRidesToday: 10,
    totalMembers: 50,
    newMembersThisWeek: 3,
    avgRating: 4.5,
  };
}

/**
 * Saves joined circles to persistent storage
 */
export async function saveJoinedCircles(circleIds: string[]): Promise<void> {
  await AsyncStorage.setItem(CIRCLES_JOINED_KEY, JSON.stringify(circleIds));
}

/**
 * Loads joined circles from persistent storage
 */
export async function loadJoinedCircles(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(CIRCLES_JOINED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Requests to join a circle (would require admin approval in production)
 */
export async function requestJoinCircle(
  circleId: string,
  _userId: string
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 600));

  return {
    success: true,
    message: 'Successfully joined the circle! Welcome to the community.',
  };
}

/**
 * Searches circles by name or institution
 */
export function searchCircles(
  query: string,
  circles: Array<{ name: string; institution: string; id: string }>
): string[] {
  const q = query.toLowerCase();
  return circles
    .filter(c => c.name.toLowerCase().includes(q) || c.institution.toLowerCase().includes(q))
    .map(c => c.id);
}
