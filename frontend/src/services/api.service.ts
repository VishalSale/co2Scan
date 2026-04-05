import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important: Send cookies with requests
    })

    // Response interceptor - just pass errors through, let route guards handle redirects
    this.api.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error)
    )
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/api/guest/auth/login', { email, password })
    return response.data
  }

  async register(name: string, email: string, password: string, confirmPassword: string, mobile: string) {
    const response = await this.api.post('/api/guest/auth/register', { name, email, password, confirmPassword, mobile })
    return response.data
  }

  async logout() {
    try {
      const response = await this.api.get('/api/guest/auth/logout')
      return response.data
    } catch (error: any) {
      // If endpoint doesn't exist, that's OK - just clear local data
      console.log('Logout endpoint not available')
      throw error
    }
  }

  async checkAuth() {
    try {
      const response = await this.api.get('/api/free/auth/me')
      // unwrap ApiResponse envelope: { message, data: { user }, success, status }
      return response.data?.data ?? response.data
    } catch (error: any) {
      throw error
    }
  }

  // Scan endpoints
  async scanWebsite(url: string, userType: 'free' | 'go' = 'free') {
    const endpoint = userType === 'go'
      ? '/api/go/home/crawl-website-co2'
      : '/api/free/home/co2-consumption'
    const response = await this.api.post(endpoint, { url })
    return response.data?.data ?? response.data
  }

  async scanWebsiteGuest(url: string) {
    // For unauthenticated (guest) users
    const response = await this.api.post('/api/guest/home/co2-consumption', { url })
    return response.data
  }

  async getCrawlStatus(jobId: string) {
    const response = await this.api.get(`/api/go/home/crawl-status/${jobId}`, {
      validateStatus: (status) => status < 600 // don't throw on 500 — we handle it manually
    })
    return response.data?.data ?? response.data
  }

  async pauseCrawl(jobId: string) {
    const response = await this.api.post(`/api/go/home/crawl-pause/${jobId}`)
    return response.data
  }

  async resumeCrawl(jobId: string) {
    const response = await this.api.post(`/api/go/home/crawl-resume/${jobId}`)
    return response.data
  }

  async getScanResult(url: string) {
    const response = await this.api.get(`/api/scan-result?url=${encodeURIComponent(url)}`)
    return response.data
  }

  // Dashboard endpoints
  async getDashboardStats(userType: 'free' | 'go' = 'free') {
    const endpoint = userType === 'go' ? '/api/go/dashboard/overall' : '/api/free/dashboard/overall'
    const response = await this.api.get(endpoint)
    return response.data?.data ?? response.data
  }

  async getAnalytics(page: number = 1, limit: number = 100) {
    const response = await this.api.get(`/api/go/analytics?page=${page}&limit=${limit}`)
    return response.data?.data ?? response.data
  }

  async getScanHistory(userType: 'free' | 'go' = 'free', page: number = 1, limit: number = 10) {
    const endpoint = userType === 'go'
      ? `/api/go/scan-history?page=${page}&limit=${limit}`
      : `/api/free/scan-history?page=${page}&limit=${limit}`
    const response = await this.api.get(endpoint)
    return response.data?.data ?? response.data
  }

  async getScanHistoryById(userType: 'free' | 'go' = 'free', id: string) {
    const endpoint = userType === 'go'
      ? `/api/go/scan-history/${id}`
      : `/api/free/scan-history/${id}`
    const response = await this.api.get(endpoint)
    return response.data?.data ?? response.data
  }

  async pauseCrawlFromHistory(jobId: string) {
    const response = await this.api.post(`/api/go/scan-history/crawl-pause/${jobId}`)
    return response.data
  }

  async resumeCrawlFromHistory(jobId: string) {
    const response = await this.api.post(`/api/go/scan-history/crawl-resume/${jobId}`)
    return response.data
  }

  async pauseAllCrawls() {
    const response = await this.api.post('/api/go/scan-history/crawl-pause-all')
    return response.data
  }

  async resumeAllCrawls() {
    const response = await this.api.post('/api/go/scan-history/crawl-resume-all')
    return response.data
  }

  async retryFailedPage(pageId: string) {
    const response = await this.api.get(`/api/go/scan-history/co2-consumption/${pageId}`, {
      timeout: 120000 // 2 min — Lighthouse scan can take 20-30s
    })
    return response.data
  }

  async getCrawlDetails(crawlId: string) {
    const response = await this.api.get(`/api/go/scan-history/${crawlId}`)
    return response.data?.data ?? response.data
  }

  async getReport(scanId: string) {
    const response = await this.api.get(`/api/auth/report/${scanId}`)
    return response.data
  }

  // User endpoints
  async getProfile(userType: 'free' | 'go' = 'free') {
    const endpoint = userType === 'go'
      ? '/api/go/profile'
      : '/api/free/profile'
    const response = await this.api.get(endpoint)
    return response.data?.data ?? response.data
  }

  async updateProfile(userType: 'free' | 'go' = 'free', data: { name: string; mobile?: string | null; profileImg?: string | null }) {
    const endpoint = userType === 'go'
      ? '/api/go/profile/update'
      : '/api/free/profile/update'
    const response = await this.api.put(endpoint, data)
    return response.data?.data ?? response.data
  }

  async changePassword(userType: 'free' | 'go' = 'free',data: { oldPassword: string; newPassword: string; confirmPassword: string }) {
     const endpoint = userType === 'go'
      ? '/api/go/setting/change-password'
      : '/api/free/setting/change-password'
    const response = await this.api.put(endpoint, data)
    return response.data?.data ?? response.data
  }

  // Billing endpoints
  async getBilling() {
    const response = await this.api.get('/api/auth/billing')
    return response.data
  }

  async exportReport(scanId: string, format: 'pdf' | 'csv' | 'json') {
    const response = await this.api.get(`/api/auth/export/${scanId}?format=${format}`, {
      responseType: 'blob'
    })
    return response.data
  }
}

export default new ApiService()
