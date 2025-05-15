import { Channel, CreateAdRequest } from '../types/types';

const API_BASE_URL = 'http://127.0.0.1:8080/api/v1';

const API_ENDPOINT = {
  categories: `${API_BASE_URL}/categories/`,
  geos: `${API_BASE_URL}/geos/`,
  similarChannels: `${API_BASE_URL}/channels/similar`,
  channels: `${API_BASE_URL}/channels/`,
  getChannelData: (id: number) => `${API_BASE_URL}/channels/${id}/get-new-data`,
  updateChannelCategory: (id: number) =>
    `${API_BASE_URL}/channels/${id}/category`,
  updateGeoCategory: (id: number) => `${API_BASE_URL}/channels/${id}/geo`,
  generateAdMessage: `${API_BASE_URL}/ads/generate`,
  createAd: `${API_BASE_URL}/ads/`,
};

async function apiFetch<TResponse, TBody = undefined>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: TBody,
  queryParams?: Record<string, string | null | undefined>,
): Promise<TResponse> {
  const url = new URL(endpoint);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value != null) {
        url.searchParams.append(key, value);
      }
    });
  }
  const response = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        errorMessage = errorBody.error;
      } else if (typeof errorBody === 'string') {
        errorMessage = errorBody;
      }
    } catch {
      const text = await response.text();
      if (text) {
        errorMessage = text;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export const fetchCategories = () =>
  apiFetch<string[]>(API_ENDPOINT.categories, 'GET');

export const fetchGeos = () => apiFetch<string[]>(API_ENDPOINT.geos, 'GET');

export const fetchSimilarChannels = (channelNames: string[]) =>
  apiFetch<Channel[], { channels_names: string[] }>(
    API_ENDPOINT.similarChannels,
    'POST',
    {
      channels_names: channelNames,
    },
  );

export const fetchChannelsByFilter = (
  category?: string | null,
  geo?: string | null,
) =>
  apiFetch<{ channels: Channel[] }>(API_ENDPOINT.channels, 'GET', undefined, {
    category,
    geo,
  });

export const fetchChannelData = (id: number) =>
  apiFetch<Channel>(API_ENDPOINT.getChannelData(id), 'GET');

export const updateChannelCategory = (id: number, categoryName: string) =>
  apiFetch<string, { category: string }>(
    API_ENDPOINT.updateChannelCategory(id),
    'PUT',
    { category: categoryName },
  );

export const updateChannelGeo = (id: number, geoName: string) =>
  apiFetch<string, { geo: string }>(API_ENDPOINT.updateGeoCategory(id), 'PUT', {
    geo: geoName,
  });

export const generateAdMessage = (
  channelNames: string[],
  description: string,
) =>
  apiFetch<
    { ad_message: string },
    { channels_names: string[]; description: string }
  >(API_ENDPOINT.generateAdMessage, 'POST', {
    channels_names: channelNames,
    description: description,
  });

export const createAd = (payload: CreateAdRequest) =>
  apiFetch<{ status: string }, CreateAdRequest>(
    API_ENDPOINT.createAd,
    'POST',
    payload,
  );
