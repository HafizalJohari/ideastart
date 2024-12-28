'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import dynamic from 'next/dynamic'
import { useChatStore } from '@/lib/store'

// Dynamically import Recharts components with no SSR
const Charts = dynamic(() => import('@/components/analytics-charts'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
})

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const messages = useChatStore(state => state.messages) || []
  const selectedModels = useChatStore(state => state.selectedModels) || []
  const selectedPlatforms = useChatStore(state => state.selectedPlatforms) || []
  const selectedLanguage = useChatStore(state => state.selectedLanguage)

  // Calculate model usage statistics
  const modelUsage = React.useMemo(() => {
    const usage = new Map<string, number>()
    messages.forEach(msg => {
      if (msg.model) {
        usage.set(msg.model, (usage.get(msg.model) || 0) + 1)
      }
    })
    return Array.from(usage.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: messages.length > 0 ? (count / messages.length) * 100 : 0
    }))
  }, [messages])

  // Calculate platform usage statistics
  const platformUsage = React.useMemo(() => {
    const usage = new Map<string, number>()
    messages.forEach(msg => {
      if (msg.platform) {
        usage.set(msg.platform, (usage.get(msg.platform) || 0) + 1)
      }
    })
    return Array.from(usage.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: messages.length > 0 ? (count / messages.length) * 100 : 0
    }))
  }, [messages])

  // Calculate language usage statistics
  const languageUsage = React.useMemo(() => {
    const usage = new Map<string, number>()
    messages.forEach(msg => {
      if (msg.language) {
        usage.set(msg.language, (usage.get(msg.language) || 0) + 1)
      }
    })
    return Array.from(usage.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: messages.length > 0 ? (count / messages.length) * 100 : 0
    }))
  }, [messages])

  // Calculate average response time
  const avgResponseTime = React.useMemo(() => {
    let totalTime = 0
    let count = 0
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'assistant' && messages[i-1].role === 'user') {
        const responseTime = new Date(messages[i].timestamp).getTime() - 
                           new Date(messages[i-1].timestamp).getTime()
        totalTime += responseTime
        count++
      }
    }
    
    return count > 0 ? Math.round(totalTime / count / 1000) : 0 // Convert to seconds
  }, [messages])

  // Calculate message statistics
  const messageStats = React.useMemo(() => {
    const userMessages = messages.filter(m => m.role === 'user').length
    const assistantMessages = messages.filter(m => m.role === 'assistant').length
    const totalMessages = messages.length
    
    return {
      userMessages,
      assistantMessages,
      totalMessages,
      averageLength: totalMessages > 0 ? Math.round(messages.reduce((acc, m) => acc + m.content.length, 0) / totalMessages) : 0,
      userRatio: totalMessages > 0 ? Math.round((userMessages / totalMessages) * 100) : 0,
      assistantRatio: totalMessages > 0 ? Math.round((assistantMessages / totalMessages) * 100) : 0
    }
  }, [messages])

  // Calculate usage trends over time
  const usageTrends = React.useMemo(() => {
    const trends = new Map<string, { date: string, count: number }[]>()
    
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleDateString()
      const model = msg.model || 'unknown'
      
      if (!trends.has(model)) {
        trends.set(model, [])
      }
      
      const modelTrend = trends.get(model)!
      const existingEntry = modelTrend.find(t => t.date === date)
      
      if (existingEntry) {
        existingEntry.count++
      } else {
        modelTrend.push({ date, count: 1 })
      }
    })
    
    return Array.from(trends.entries()).map(([model, data]) => ({
      model,
      data: data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }))
  }, [messages])

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Analytics & Insights</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messageStats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {messageStats.userMessages} user ({messageStats.userRatio}%), {messageStats.assistantMessages} assistant ({messageStats.assistantRatio}%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">Per message</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Message Length</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messageStats.averageLength}</div>
            <p className="text-xs text-muted-foreground">Characters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models/Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(selectedModels?.length || 0) + (selectedPlatforms?.length || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {selectedModels?.length || 0} models, {selectedPlatforms?.length || 0} platforms
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">Model Usage</TabsTrigger>
          <TabsTrigger value="platforms">Platform Usage</TabsTrigger>
          <TabsTrigger value="languages">Language Usage</TabsTrigger>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
        </TabsList>
        
        <Charts 
          modelUsage={modelUsage}
          platformUsage={platformUsage}
          languageUsage={languageUsage}
          usageTrends={usageTrends}
          colors={COLORS}
        />
      </Tabs>
    </div>
  )
} 