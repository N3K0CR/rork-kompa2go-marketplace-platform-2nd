export interface Rating {
  id: string;
  type: 'trip' | 'service';
  relatedId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'client' | 'kommuter' | 'provider';
  toUserId: string;
  toUserName: string;
  toUserRole: 'client' | 'kommuter' | 'provider';
  rating: number;
  categories?: {
    punctuality?: number;
    communication?: number;
    cleanliness?: number;
    professionalism?: number;
    quality?: number;
  };
  comment?: string;
  photos?: string[];
  response?: {
    comment: string;
    createdAt: Date;
  };
  status: 'pending' | 'published' | 'flagged' | 'removed';
  helpful: number;
  reported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingStats {
  userId: string;
  userRole: 'kommuter' | 'provider';
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages?: {
    punctuality?: number;
    communication?: number;
    cleanliness?: number;
    professionalism?: number;
    quality?: number;
  };
  lastUpdated: Date;
}

export interface RatingPrompt {
  id: string;
  userId: string;
  type: 'trip' | 'service';
  relatedId: string;
  targetUserId: string;
  targetUserName: string;
  status: 'pending' | 'completed' | 'dismissed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
}
