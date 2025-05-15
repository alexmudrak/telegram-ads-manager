export interface Channel {
  id: number;
  username: string;
  title: string;
  description: string;
  photo_element: string;
  category: string;
  geo: string;
  subscribers: number;
}

export interface CreateAdRequest {
  text: string;
  promote_url: string;
  cpm: number;
  views_per_user: number;
  budget: number;
  daily_budget: number;
  active: boolean;
  target_type: 'channel' | 'search' | 'bot';
  channels: string[];
  method: 'draft' | 'save';
}
