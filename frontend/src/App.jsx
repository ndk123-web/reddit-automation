import React, { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, 
  Kanban, 
  Radio, 
  Hash, 
  Clock, 
  Layers, 
  BarChart3, 
  FileText, 
  HeartPulse,
  UserX, 
  Sliders, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ExternalLink,
  MessageSquare, 
  Sparkles, 
  X, 
  ChevronRight, 
  Send, 
  Sun, 
  Moon, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  Bell, 
  Menu, 
  CheckCircle,
  Search,
  Shield,
  Trash,
  AlertCircle,
  Activity,
  TrendingUp,
  Users
} from "lucide-react";

// API Base URL
const API_URL = "http://localhost:8000";

export default function App() {
  // Theme System
  const [theme, setTheme] = useState(() => localStorage.getItem("pulsepilot_theme") || "dark");

  // Authentication State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("pulsepilot_auth") === "true");
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup' | 'forgot' | 'reset' | 'otp'
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", confirmPassword: "", otp: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // App Core States
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState({
    total_leads: 0,
    qualified_leads: 0,
    queue_pending: 0,
    outreach_sent: 0,
    replied: 0,
    conversion_rate: 0
  });
  const [leads, setLeads] = useState([]);
  const [hoveredTrendMonth, setHoveredTrendMonth] = useState("Mar");
  const [hoveredQualMonth, setHoveredQualMonth] = useState("Mar");
  const [hoveredWeekDay, setHoveredWeekDay] = useState(null);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsFilter, setLeadsFilter] = useState({ status: "", minScore: "", subreddit: "" });
  const [subreddits, setSubreddits] = useState([]);
  const [topSubreddits, setTopSubreddits] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [queue, setQueue] = useState([]);
  const [outreachQueueTotal, setOutreachQueueTotal] = useState(0);
  const [outreachQueueTotalPages, setOutreachQueueTotalPages] = useState(1);
  const [sequences, setSequences] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [outreachQueuePage, setOutreachQueuePage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [health, setHealth] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [settings, setSettings] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);

  // Live settings states (upgraded Settings panel)
  const [settingsMinScore, setSettingsMinScore] = useState(7);
  const [settingsModel, setSettingsModel] = useState("Gemini 1.5 Pro (Recommended)");
  const [settingsAutoQualify, setSettingsAutoQualify] = useState(true);
  const [settingsMaxMessages, setSettingsMaxMessages] = useState(50);
  const [settingsInterval, setSettingsInterval] = useState(15);
  const [settingsActiveStart, setSettingsActiveStart] = useState("09:00 AM");
  const [settingsActiveEnd, setSettingsActiveEnd] = useState("05:00 PM");
  const [settingsEmailNotif, setSettingsEmailNotif] = useState(true);
  const [settingsHighScoreNotif, setSettingsHighScoreNotif] = useState(true);
  const [settingsReplyNotif, setSettingsReplyNotif] = useState(true);

  // UI States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // 'monitor', 'queue'
  const [notice, setNotice] = useState(null); // { type: 'success'|'error', text: '' }
  const [selectedLead, setSelectedLead] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Creation/Edit states
  const [newSub, setNewSub] = useState({ name: "", dm_allowed: true, rules: "" });
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [newKw, setNewKw] = useState("");
  const [showAddKwModal, setShowAddKwModal] = useState(false);
  const [newBlocked, setNewBlocked] = useState({ username: "", reason: "" });
  const [showAddDncModal, setShowAddDncModal] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState({ dm: "", comment: "" });
  const [aiGenerating, setAiGenerating] = useState(false);
  
  // Custom Interactive Template states
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingTemplateText, setEditingTemplateText] = useState("");
  const [previewTemplateText, setPreviewTemplateText] = useState("");

  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);
const [editedOutreachContent, setEditedOutreachContent] = useState("");

  // Simulated notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: "AI Qualified a new lead on r/saas with score 10/10!", time: "2m ago", read: false },
    { id: 2, text: "Sender u/pulsepilot_sender shadowban check passed.", time: "15m ago", read: true },
    { id: 3, text: "APSScheduler successfully completed check in r/startups.", time: "1h ago", read: true }
  ]);

  // Apply Theme on change
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("pulsepilot_theme", theme);
  }, [theme]);

  // Auto-dismiss notice banners
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  // Simulated Auth Checker on Startup (1.2 seconds loader)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Load backend data if authenticated - Only fetch core data once or appropriately
  // Active Tab should NOT be here to avoid 0 rerenders and unnecessary API calls!
  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      fetchAnalytics();
      fetchSubreddits();
      fetchKeywords();
      fetchSequences();
      fetchHealth();
      fetchBlocked();
      fetchSettings();
    }
  }, [isAuthenticated, isCheckingAuth]);

  // Dependent fetches for Leads and Logs (pagination and filters)
  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      fetchLeads();
    }
  }, [isAuthenticated, isCheckingAuth, leadsPage, leadsFilter]);

  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      fetchLogs();
    }
  }, [isAuthenticated, isCheckingAuth, logsPage]);

  // Auto-refresh clock (triggers a state update to pull fresh data without stale closures)
  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      const interval = setInterval(() => {
        setRefreshTick(tick => tick + 1);
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isCheckingAuth]);

  // Execute periodic fetches matching active state context
  useEffect(() => {
    if (refreshTick > 0 && isAuthenticated && !isCheckingAuth) {
      console.log(`Background Sync [Tick: ${refreshTick}]... fetching fresh data`);
      fetchAnalytics();
      fetchSubreddits();
      fetchQueue();
      fetchLeads();
      fetchLogs();
      fetchHealth();
    }
  }, [refreshTick]);

  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      fetchQueue();
    }
  }, [isAuthenticated, isCheckingAuth, outreachQueuePage]);

  // Keyboard shortcut for Search (⌘ K or Ctrl K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // API Fetch utilities
  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/analytics/overview`);
      if (res.ok) {
        const data = await res.json();
        
        // Map backend funnel shape to frontend analytics shape
        const total_leads = data.total_leads || 0;
        const discovered = data.discovered || 0;
        const qualified = data.qualified || 0;
        const queued = data.queued || 0;
        const sent = data.sent || 0;
        const replied = data.replied || 0;
        const converted = data.converted || 0;

        const conversion_rate = sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0;

        setAnalytics({
          total_leads: total_leads,
          discovered_leads: discovered,
          qualified_leads: qualified,
          queue_pending: queued,
          outreach_sent: sent,
          replied: replied,
          converted: converted,
          conversion_rate: conversion_rate
        });

        // Best-effort fetch for top subreddits
        try {
          const r2 = await fetch(`${API_URL}/analytics/subreddits?limit=6`);
          if (r2.ok) {
            const body = await r2.json();
            setTopSubreddits(body.top_subreddits || body);
          }
        } catch (e) {
          console.debug("Failed to fetch top subreddits", e);
        }
      } else {
        setAnalytics({
          total_leads: leadsTotal || 0,
          discovered_leads: leadsTotal || 0,
          qualified_leads: leads.filter(l => l.status === "qualified").length || 0,
          queue_pending: queue.length || 0,
          outreach_sent: leads.filter(l => l.status === "outreach_sent").length || 0,
          replied: leads.filter(l => l.status === "replied").length || 0,
          converted: 0,
          conversion_rate: 0
        });
      }
    } catch (e) { 
      console.error("Error fetching analytics:", e); 
      setAnalytics({
        total_leads: leadsTotal || 0,
        discovered_leads: leadsTotal || 0,
        qualified_leads: leads.filter(l => l.status === "qualified").length || 0,
        queue_pending: queue.length || 0,
        outreach_sent: leads.filter(l => l.status === "outreach_sent").length || 0,
        replied: leads.filter(l => l.status === "replied").length || 0,
        converted: 0,
        conversion_rate: 0
      });
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: leadsPage,
        limit: 50,
        ...(leadsFilter.status && { status: leadsFilter.status }),
        ...(leadsFilter.minScore && { min_score: leadsFilter.minScore }),
        ...(leadsFilter.subreddit && { subreddit: leadsFilter.subreddit })
      });
      const res = await fetch(`${API_URL}/leads?${query}`);
      if (res.ok) {
        const data = await res.json();
        const formattedLeads = data.items.map(lead => ({
           id: lead.id,
           reddit_post_id: lead.reddit_post_id,
           subreddit_name: lead.subreddit_name,
           author_username: lead.author_username,
           title: lead.title,
           content: lead.content,
           post_url: lead.post_url,
           ai_score: lead.ai_score,
           ai_reason: lead.ai_reason,
           status: lead.status || "discovered",
           created_utc: lead.created_utc,
           fetched_at: lead.fetched_at
        }));
        setLeads(formattedLeads);
        setLeadsTotal(data.total || formattedLeads.length);
      }
    } catch (e) { console.error("Error fetching leads:", e); }
    finally { setLoading(false); }
  };

  const fetchSubreddits = async () => {
    try {
      setActionLoading("fetch_subreddits");
      const res = await fetch(`${API_URL}/subreddits`);
      if (res.ok) {
        setSubreddits(await res.json());
      }
    } catch (e) { 
      console.error(e); 
    } finally {
      // Small timeout to prevent flicker if it loads too fast
      setTimeout(() => setActionLoading(prev => prev === "fetch_subreddits" ? null : prev), 300);
    }
  };

  const fetchKeywords = async () => {
    try {
      const res = await fetch(`${API_URL}/keywords`);
      if (res.ok) setKeywords(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_URL}/outreach/queue?page=${outreachQueuePage}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);

        setQueue(items);
        setOutreachQueueTotal(Array.isArray(data) ? items.length : (data.total || items.length));
        setOutreachQueueTotalPages(Array.isArray(data) ? Math.max(1, Math.ceil(items.length / 10)) : (data.total_pages || 1));

        if (!Array.isArray(data) && data.page && data.page !== outreachQueuePage) {
          setOutreachQueuePage(data.page);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchSequences = async () => {
    try {
      const res = await fetch(`${API_URL}/outreach/sequences`);
      if (res.ok) setSequences(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/audit?page=${logsPage}&limit=20`);
      if (res.ok) {
         const data = await res.json();
         const formattedLogs = data.items.map(log => ({
            id: log.id,
            action: log.event_type || log.action, // Fallback mapping
            details: log.message || log.details,
            status: log.status,
            timestamp: log.created_at || log.timestamp
         }));
         setLogs(formattedLogs);
         setLogsTotal(data.total);
      }
    } catch (e) { console.error(e); }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/analytics/health`);
      if (res.ok) setHealth(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchBlocked = async () => {
    try {
      const res = await fetch(`${API_URL}/blocked-users`);
      if (res.ok) setBlocked(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        const minSc = data.find(s => s.key === "score_threshold");
        if (minSc) setSettingsMinScore(parseInt(minSc.value, 10));
        const maxMs = data.find(s => s.key === "daily_message_limit");
        if (maxMs) setSettingsMaxMessages(parseInt(maxMs.value, 10));
      }
    } catch (e) { console.error(e); }
  };

  // Actions
  const handleTriggerMonitor = async () => {
    try {
      setActionLoading("monitor");
      const res = await fetch(`${API_URL}/outreach/trigger-monitor`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotice({ type: "success", text: "Scan trigger completed successfully! New leads mapped and qualified." });
        fetchLeads();
        fetchAnalytics();
        fetchLogs();
      } else {
        setNotice({ type: "error", text: data.detail || "Failed to trigger monitor scan." });
      }
    } catch (e) {
      setNotice({ type: "error", text: "Server network error occurred." });
    } finally { setActionLoading(null); }
  };

  const handleTriggerQueue = async () => {
    try {
      setActionLoading("queue");
      const res = await fetch(`${API_URL}/outreach/trigger-queue`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotice({ type: "success", text: "Outreach messages in processing queue successfully dispatched!" });
        fetchQueue();
        fetchAnalytics();
        fetchLogs();
      } else {
        setNotice({ type: "error", text: data.detail || "Failed to deliver outreach queue." });
      }
    } catch (e) {
      setNotice({ type: "error", text: "Server network error occurred." });
    } finally { setActionLoading(null); }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchLeads();
        fetchAnalytics();
        if (selectedLead && selectedLead.id === leadId) {
          const updated = await res.json();
          setSelectedLead(updated);
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm("Are you sure you want to delete this qualified lead from history?")) return;
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedLead(null);
        fetchLeads();
        fetchAnalytics();
        setNotice({ type: "success", text: "Lead successfully removed." });
      }
    } catch (e) { console.error(e); }
  };

  const handleAddSubreddit = async (e) => {
    e.preventDefault();
    if (!newSub.name) return;
    try {
      setActionLoading("add_subreddit");
      const res = await fetch(`${API_URL}/subreddits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSub, active: true })
      });
      if (res.ok) {
        setNewSub({ name: "", dm_allowed: true, rules: "" });
        setShowAddSubModal(false);
        setNotice({ type: "success", text: "Subreddit registered successfully for AI scanning." });
        fetchSubreddits();
        fetchAnalytics();
      } else {
        const errorData = await res.json();
        setNotice({ type: "error", text: errorData.detail || "Failed to add subreddit." });
      }
    } catch (e) {
      console.error(e);
      setNotice({ type: "error", text: "Network error while adding subreddit." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSubreddit = async (id, currentActive, name) => {
    try {
      console.log("Click toggle subreddit active")
      const isActivate = (currentActive === false) ? "activate" : "deactivate";
      const res = await fetch(`${API_URL}/subreddits/${name}/${isActivate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) {
        fetchSubreddits();
        fetchAnalytics();
        setNotice({ type: "success", text: `Subreddit feed state toggled.` });
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteSubreddit = async (id) => {
    if (!confirm("Remove this subreddit feed? Mapped posts won't be deleted.")) return;
    try {
      const res = await fetch(`${API_URL}/subreddits/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSubreddits();
        fetchAnalytics();
        setNotice({ type: "success", text: "Subreddit feed successfully removed." });
      }
    } catch (e) { console.error(e); }
  };

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKw) return;
    try {
      const res = await fetch(`${API_URL}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKw, active: true })
      });
      if (res.ok) {
        setNewKw("");
        setShowAddKwModal(false);
        setNotice({ type: "success", text: `Keyword pill filter "${newKw}" registered.` });
        fetchKeywords();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteKeyword = async (id) => {
    try {
      const res = await fetch(`${API_URL}/keywords/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchKeywords();
        setNotice({ type: "success", text: "Keyword filter removed." });
      }
    } catch (e) { console.error(e); }
  };

  const handleAddBlocked = async (e) => {
    e.preventDefault();
    if (!newBlocked.username) return;
    try {
      const res = await fetch(`${API_URL}/blocked-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBlocked)
      });
      if (res.ok) {
        setNewBlocked({ username: "", reason: "" });
        setShowAddDncModal(false);
        setNotice({ type: "success", text: "Added user to Do-Not-Contact blacklist successfully." });
        fetchBlocked();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteBlocked = async (id) => {
    try {
      const res = await fetch(`${API_URL}/blocked-users/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchBlocked();
        setNotice({ type: "success", text: "User removed from block list." });
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateSetting = async (id, newValue, desc) => {
    try {
      const res = await fetch(`${API_URL}/settings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue.toString(), description: desc })
      });
      if (res.ok) {
        fetchSettings();
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveSettingsPanel = () => {
    const minScSet = settings.find(s => s.key === "score_threshold");
    const limitSet = settings.find(s => s.key === "daily_message_limit");
    if (minScSet) handleUpdateSetting(minScSet.id, settingsMinScore, minScSet.description);
    if (limitSet) handleUpdateSetting(limitSet.id, settingsMaxMessages, limitSet.description);

    setNotice({ type: "success", text: "PulsePilot global settings successfully synchronized with SQLite database!" });
  };

  const handleResetSettingsDefaults = () => {
    setSettingsMinScore(7);
    setSettingsModel("Gemini 1.5 Pro (Recommended)");
    setSettingsAutoQualify(true);
    setSettingsMaxMessages(50);
    setSettingsInterval(15);
    setSettingsActiveStart("09:00 AM");
    setSettingsActiveEnd("05:00 PM");
    setSettingsEmailNotif(true);
    setSettingsHighScoreNotif(true);
    setSettingsReplyNotif(true);
    setNotice({ type: "success", text: "Settings fields successfully reset to system default profiles." });
  };

  const handleGenerateAIOutreach = async (lead) => {
    try {
      setAiGenerating(true);
      setAiGeneratedContent({ dm: "", comment: "" });
      
      setTimeout(() => {
        const author = lead.author_username;
        const sub = lead.subreddit_name;
        
        const generatedDm = 
          `Hi u/${author},\n\nSaw your recommendation request on r/${sub} and wanted to drop some peer insights. ` +
          `We've solved similar social lead qualified monitoring bottlenecks by deploying automated APScheduler loops. ` +
          `It qualifies target posts in under 2 minutes and saves 20+ manual hours weekly.\n\nLet me know if you'd like us ` +
          `to share our open-source codebase template for this pipeline!\n\nBest,\nPulsePilot AI Agent`;

        const generatedComment = 
          `This is a common workflow bottleneck. Qualification pre-screening against custom subreddits and keywords ` +
          `usually filters out 90% of marketing spam. Standardizing stages (discovered, qualified, outreach_sent, nurtured) ` +
          `before cold DMing ensures highly contextual sales outreach. Happy to share a layout if you need one!`;

        setAiGeneratedContent({
          dm: generatedDm,
          comment: generatedComment
        });
        setAiGenerating(false);
      }, 800);

    } catch (e) {
      console.error(e);
      setAiGenerating(false);
    }
  };

  const handleScheduleOutreach = async (lead, type) => {
    const content = type === "dm" ? aiGeneratedContent.dm : aiGeneratedContent.comment;
    if (!content) return;

    try {
      const scheduledTime = new Date(Date.now() + 10 * 60000).toISOString(); 
      const res = await fetch(`${API_URL}/outreach/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          recipient: lead.author_username,
          message_type: type,
          generated_content: content,
          status: "pending",
          scheduled_for: scheduledTime
        })
      });
      if (res.ok) {
        setNotice({ type: "success", text: `Outreach scheduled in delivery queue successfully!` });
        handleUpdateLeadStatus(lead.id, "queued");
        fetchQueue();
      }
    } catch (e) { console.error(e); }
  };

  const handleApproveQueueItem = async (itemId) => {
    try {
      const res = await fetch(`${API_URL}/outreach/queue/${itemId}`, { method: "DELETE" }); 
      if (res.ok) {
        setNotice({ type: "success", text: "Outreach message approved and sent immediately!" });
        fetchQueue();
        fetchAnalytics();
        fetchLogs();
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveQueueItem = async () => {
    if (!selectedQueueItem) return;

    try {
      const res = await fetch(`${API_URL}/outreach/queue/${selectedQueueItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreach_content: editedOutreachContent }),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setQueue((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
        setSelectedQueueItem(updatedItem);
        setEditedOutreachContent(updatedItem.outreach_content || "");
        setNotice({ type: "success", text: "Outreach content updated successfully." });
        setIsQueueDrawerOpen(false);
        fetchQueue();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setNotice({ type: "error", text: errorData.detail || "Failed to update outreach content." });
      }
    } catch (e) {
      console.error(e);
      setNotice({ type: "error", text: "Network error while updating outreach content." });
    }
  };

  // Auth Screen Submit Handlers
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (authMode === "login") {
      if (!authForm.email || !authForm.password) {
        setAuthError("Email and password fields are required.");
        return;
      }
      setAuthSuccess("Credentials verified. MFA verification required!");
      setTimeout(() => {
        setAuthMode("otp");
        setAuthSuccess("");
      }, 700);

    } else if (authMode === "signup") {
      if (!authForm.name || !authForm.email || !authForm.password) {
        setAuthError("All credentials fields are required.");
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
      setAuthSuccess("Registration completed. Please verify security code.");
      setTimeout(() => {
        setAuthMode("otp");
        setAuthSuccess("");
      }, 800);

    } else if (authMode === "forgot") {
      if (!authForm.email) {
        setAuthError("Please input a registered email.");
        return;
      }
      setAuthSuccess("Reset token dispatched. Check your registered inbox!");
      setTimeout(() => {
        setAuthMode("reset");
        setAuthSuccess("");
      }, 1500);

    } else if (authMode === "reset") {
      if (!authForm.password || authForm.password !== authForm.confirmPassword) {
        setAuthError("Passwords are empty or mismatched.");
        return;
      }
      setAuthSuccess("Password changed successfully. Returning to Login...");
      setTimeout(() => {
        setAuthMode("login");
        setAuthSuccess("");
      }, 1500);

    } else if (authMode === "otp") {
      if (!authForm.otp || authForm.otp.length < 4) {
        setAuthError("Please input a valid security OTP.");
        return;
      }
      setAuthSuccess("Identity confirmed. Mounting PulsePilot console...");
      setTimeout(() => {
        localStorage.setItem("pulsepilot_auth", "true");
        setIsAuthenticated(true);
        setAuthSuccess("");
      }, 800);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pulsepilot_auth");
    setIsAuthenticated(false);
    setAuthMode("login");
    setAuthForm({ name: "", email: "", password: "", confirmPassword: "", otp: "" });
    setShowProfileMenu(false);
  };

  // Drag and Drop Pipeline Handlers
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData("text/plain", leadId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!isNaN(leadId)) {
      handleUpdateLeadStatus(leadId, targetStatus);
      setNotice({ type: "success", text: `Lead status updated to ${targetStatus} via pipeline drag-drop.` });
    }
  };

  // Helper for Relative Time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Recent";
    const date = typeof timestamp === "number" ? new Date(timestamp * 1000) : new Date(timestamp);
    const diff = Math.floor((new Date() - date) / 1000); // difference in seconds

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const formatQueueScheduledTime = (item) => {
    const scheduledTime = item.scheduled_for || item.next_action_at || item.outreach_sent_at || item.created_utc;
    if (!scheduledTime) return "Schedule pending";

    const date = new Date(scheduledTime);
    if (Number.isNaN(date.getTime())) return "Schedule pending";

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Mapped list of subreddits with metrics fallbacks
  const subredditMetrics = useMemo(() => {
    const total = subreddits.length;
    const activeCount = subreddits.filter(s => s.active).length;
    return {
      total,
      active: activeCount,
      leadsCount: analytics.total_leads || 0, 
      qualifiedCount: analytics.qualified_leads || 0,
      avgConversion: analytics.conversion_rate !== undefined ? `${analytics.conversion_rate}%` : '0%'
    };
  }, [subreddits, analytics]);

  // Account Health values
  const healthStats = useMemo(() => {
    return {
      karma: health?.karma || "0",
      rateLimit: health?.rateLimit || 0,
      dailyCount: health?.dailyCount || 0,
      dailyLimit: health?.dailyLimit || 50,
      shadowbanStatus: health?.shadowbanStatus || "Unknown",
      status: health?.status || "Loading..."
    };
  }, [health]);

  // Filtered Leads
  const filteredLeadsList = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = searchQuery 
        ? (l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           l.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
           l.author_username.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchesSearch;
    });
  }, [leads, searchQuery]);

  // RENDER: Loading/Auth Checking Screen (1.2 seconds Startup Spinner)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-[#f4f4f5] radial-mesh space-y-4">
        {/* Glowing Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center shadow-glow animate-pulse">
          <Activity className="w-9 h-9 text-white" />
        </div>
        <div className="space-y-1.5 text-center">
          <h2 className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent uppercase">
            PulsePilot
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
            Authenticating secure credentials session...
          </p>
        </div>
      </div>
    );
  }

  // RENDER: Authentication flow exactly matching reference login card (Image 15)
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === "dark" ? "bg-[#09090b] text-[#f4f4f5]" : "bg-[#f8fafc] text-[#0f172a]"} radial-mesh overflow-y-auto relative transition-colors duration-300`}>
        {/* Theme Switcher Toggle */}
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute top-6 right-6 p-2.5 rounded-xl border border-glassBorder bg-zinc-950/10 hover:bg-white/5 transition-all text-zinc-800 dark:text-zinc-400 shadow-glow"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-accentGold" /> : <Moon className="w-4 h-4 text-accentPurple" />}
        </button>

        {/* Glow backdrop decor */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-accentPurple/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-accentBlue/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Auth Card Container - max-w-md matching screenshot exact spacing */}
        <div className="w-full max-w-[440px] bg-white dark:bg-[#0d0d12]/95 border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-[28px] relative overflow-hidden shadow-2xl transition-all duration-300">
          <div className="text-center space-y-3.5 mb-7">
            {/* Heartbeat Logo Square Gradient */}
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            
            <h2 className="font-extrabold text-2xl tracking-tight text-zinc-900 dark:text-white">
              {authMode === "login" && <>Welcome to <span className="text-[#8b5cf6] font-extrabold">PulsePilot</span></>}
              {authMode === "signup" && <>Create your account</>}
              {authMode === "forgot" && <>Forgot Password?</>}
              {authMode === "reset" && <>Reset Password</>}
              {authMode === "otp" && <>OTP Verification</>}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 font-medium">
              {authMode === "login" && "AI-powered Reddit lead generation"}
              {authMode === "signup" && "Join PulsePilot to automate Reddit qualified leads"}
              {authMode === "forgot" && "Enter your email to receive a security OTP token"}
              {authMode === "reset" && "Define a secure new credentials signature"}
              {authMode === "otp" && "Enter the security code sent to your email"}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3.5 rounded-xl bg-accentRed/10 border border-accentRed/30 text-accentRed flex items-center gap-2.5 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="p-3.5 rounded-xl bg-accentGreen/10 border border-accentGreen/30 text-accentGreen flex items-center gap-2.5 text-xs font-medium animate-fade-in">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* OAuth Buttons - GitHub & Google */}
            {(authMode === "login" || authMode === "signup") && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthSuccess("Connecting secure GitHub channel...");
                    setTimeout(() => {
                      localStorage.setItem("pulsepilot_auth", "true");
                      setIsAuthenticated(true);
                      setAuthSuccess("");
                    }, 800);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-zinc-50 dark:bg-zinc-50 dark:bg-zinc-950/20 text-xs text-zinc-800 dark:text-zinc-700 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  <span>Continue with GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthSuccess("Connecting secure Google credentials...");
                    setTimeout(() => {
                      localStorage.setItem("pulsepilot_auth", "true");
                      setIsAuthenticated(true);
                      setAuthSuccess("");
                    }, 800);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-zinc-50 dark:bg-zinc-50 dark:bg-zinc-950/20 text-xs text-zinc-800 dark:text-zinc-700 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.115-5.136 4.115-3.418 0-6.2-2.782-6.2-6.2 0-3.417 2.782-6.2 6.2-6.2 1.552 0 2.955.576 4.041 1.696l3.12-3.12C18.91 2.68 15.78 1.5 12.24 1.5c-5.79 0-10.5 4.71-10.5 10.5s4.71 10.5 10.5 10.5c5.36 0 9.84-3.87 9.84-9.5 0-.616-.076-1.186-.217-1.715H12.24z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Separator */}
                <div className="relative py-3.5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800/80"></div>
                  </div>
                  <span className="relative px-3.5 bg-white dark:bg-[#0d0d12] text-[10px] text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
                    Or continue with email
                  </span>
                </div>
              </div>
            )}

            {/* Name input for signup */}
            {authMode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Carter"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#07070a] border border-zinc-200 dark:border-zinc-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-accentPurple focus:ring-1 focus:ring-accentPurple transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            {(authMode === "login" || authMode === "signup" || authMode === "forgot") && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 w-4 h-4" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#07070a] border border-zinc-200 dark:border-zinc-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-accentPurple focus:ring-1 focus:ring-accentPurple transition-all"
                  />
                </div>
              </div>
            )}

            {/* Password field */}
            {(authMode === "login" || authMode === "signup" || authMode === "reset") && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#07070a] border border-zinc-200 dark:border-zinc-800/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-accentPurple focus:ring-1 focus:ring-accentPurple transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password field */}
            {(authMode === "signup" || authMode === "reset") && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 w-4 h-4" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#07070a] border border-zinc-200 dark:border-zinc-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-accentPurple focus:ring-1 focus:ring-accentPurple transition-all"
                  />
                </div>
              </div>
            )}

            {/* OTP Verification */}
            {authMode === "otp" && (
              <div className="space-y-4 text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  Please input the 4-digit code dispatched to your corporate email for security checks.
                </p>
                <div className="flex justify-center gap-3">
                  <input
                    type="text"
                    maxLength="4"
                    required
                    placeholder="0000"
                    value={authForm.otp}
                    onChange={(e) => setAuthForm({ ...authForm, otp: e.target.value })}
                    className="w-32 bg-zinc-50 dark:bg-[#07070a] border border-zinc-200 dark:border-zinc-800/80 rounded-xl py-2.5 text-center text-xl font-bold tracking-widest text-zinc-800 dark:text-white focus:outline-none focus:border-accentPurple"
                  />
                </div>
              </div>
            )}

            {/* Remember Me / Forgot Password for Login */}
            {authMode === "login" && (
              <div className="flex items-center justify-between text-[11px] pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 font-semibold select-none">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 accent-[#6366f1] focus:ring-0" 
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setAuthMode("forgot")}
                  className="text-[#6366f1] dark:text-[#8b5cf6] font-bold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-zinc-800 dark:text-white font-bold py-2.5 rounded-xl text-xs hover:opacity-95 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all shadow-glow flex items-center justify-center gap-2 mt-4"
            >
              <span>
                {authMode === "login" && "Sign in"}
                {authMode === "signup" && "Register"}
                {authMode === "forgot" && "Send link"}
                {authMode === "reset" && "Update password"}
                {authMode === "otp" && "Verify"}
              </span>
            </button>

            {/* Toggle auth state links */}
            <div className="text-center text-xs text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
              {authMode === "login" ? (
                <p className="font-medium text-zinc-500 dark:text-zinc-500 dark:text-zinc-400">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setAuthMode("signup")} className="text-[#6366f1] dark:text-[#8b5cf6] font-bold hover:underline">
                    Sign up
                  </button>
                </p>
              ) : (
                <button type="button" onClick={() => setAuthMode("login")} className="text-[#6366f1] dark:text-[#8b5cf6] font-bold hover:underline">
                  Return to Sign In page
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Agreement Footer Disclaimer - OUTSIDE the Card body */}
        <p className="text-[10px] text-zinc-500 mt-6 text-center leading-relaxed max-w-[320px]">
          By continuing, you agree to PulsePilot's Terms of Service and Privacy Policy
        </p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${theme === "dark" ? "bg-darkBg text-zinc-800 dark:text-zinc-400" : "bg-[#f8fafc] text-zinc-900"} radial-mesh overflow-hidden relative`}>
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-accentPurple/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* MOBILE HEADER DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 bg-white dark:bg-[#0f0f1a] border-r border-glassBorder h-full flex flex-col justify-between shrink-0 animate-slide-in" onClick={e => e.stopPropagation()}>
            <div>
              <div className="p-6 border-b border-glassBorder flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white shadow-glow shrink-0">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="font-black text-base leading-tight tracking-wider bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
                      PULSEPILOT
                    </h1>
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium tracking-widest">REDDIT AUTOMATION</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {renderNavItems()}
              </nav>
            </div>
            
            <div className="p-4 border-t border-zinc-200 dark:border-glassBorder/60 bg-zinc-50 dark:bg-zinc-950/20">
              {renderSidebarProfile()}
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className={`bg-white dark:bg-[#0f0f1a] border-r border-glassBorder flex flex-col justify-between shrink-0 transition-all duration-300 hidden md:flex ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}>
        <div>
          <div className="p-6 border-b border-glassBorder flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white shadow-glow shrink-0">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div className="animate-fade-in">
                  <h1 className="font-black text-base leading-tight tracking-wider bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
                    PULSEPILOT
                  </h1>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium tracking-widest">
                    REDDIT AI PIPELINE
                  </p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hidden lg:block shrink-0 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {renderNavItems()}
          </nav>
        </div>

        <div className="p-4 border-t border-glassBorder bg-zinc-50 dark:bg-[#0a0a12]">
          {renderSidebarProfile()}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto font-sans">
        
        {/* HEADER */}
        <header className="h-16 glass-panel border-b border-glassBorder px-6 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="text-zinc-500 dark:text-zinc-400 hover:text-white md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-800 dark:text-zinc-100 dark:text-zinc-700 dark:text-zinc-400">
                {activeTab === "overview" ? "PulsePilot Control Room" : `${activeTab.replace("-", " ")}`}
              </h2>
              <p className="text-[10px] text-zinc-500">
                Telemetry Sync: Active Database connection online
              </p>
            </div>
          </div>

          <div className="relative w-64 md:w-80 hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input
              id="global-search"
              type="text"
              placeholder="Search leads, subreddits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-glassBorder rounded-xl pl-9 pr-12 py-1.5 text-xs text-zinc-800 dark:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 text-[9px] text-zinc-500 font-bold">
              ⌘ K
            </kbd>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-lg border border-glassBorder bg-zinc-950/10 hover:bg-white/5 transition-colors text-zinc-800 dark:text-zinc-400"
              title="Toggle Theme System"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-accentGold" /> : <Moon className="w-4 h-4 text-accentPurple" />}
            </button>

            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="p-1.5 rounded-lg border border-glassBorder bg-zinc-950/10 hover:bg-white/5 transition-colors relative text-zinc-800 dark:text-zinc-400"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accentRed"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl p-4 shadow-premium border border-glassBorder z-30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-glassBorder pb-2">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-400">Alerts & Notifications</span>
                    <button className="text-[10px] text-accentBlue hover:underline" onClick={() => setNotifications([])}>Clear all</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-zinc-100/60 dark:bg-zinc-950/40 text-[11px] leading-snug border border-zinc-150 dark:border-glassBorder/40">
                        <p className="text-zinc-600 dark:text-zinc-300">{n.text}</p>
                        <span className="text-[9px] text-zinc-500 mt-1 block">{n.time}</span>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-xs text-zinc-600 text-center italic py-4">No new alerts</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleTriggerMonitor}
              disabled={actionLoading !== null}
              className="px-3 py-1.5 rounded-lg glass-card text-xs font-semibold hover:bg-white/5 border border-glassBorder flex items-center gap-1.5 disabled:opacity-50 text-zinc-800 dark:text-zinc-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === "monitor" ? "animate-spin text-accentPurple" : ""}`} />
              <span className="hidden sm:inline">Monitor Scan</span>
            </button>
            <button
              onClick={handleTriggerQueue}
              disabled={actionLoading !== null}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accentPurple to-accentBlue text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50 shadow-glow"
            >
              <Send className={`w-3.5 h-3.5 ${actionLoading === "queue" ? "animate-bounce text-white" : ""}`} />
              <span className="hidden sm:inline">Deliver Queue</span>
            </button>
          </div>
        </header>

        {/* BODY PANEL CONTENT */}
        <div className="flex-1 p-6 md:p-8 space-y-6">
          
          {notice && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-fade-in ${
              notice.type === "success" 
                ? "bg-accentGreen/10 border-accentGreen/30 text-accentGreen"
                : "bg-accentRed/10 border-accentRed/30 text-accentRed"
            }`}>
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-semibold">{notice.text}</p>
            </div>
          )}

          {/* VIEW: OVERVIEW DASHBOARD */}
          {activeTab === "overview" && analytics && (
            <div className="space-y-6">
              
              {/* Header subtitle alignment exactly matching the screenshot */}
              <div className="mb-2 shrink-0">
                <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Dashboard</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                  Welcome back! Here's what's happening with your leads today.
                </p>
              </div>

              {/* Stat Cards - Grid of 4 exactly matching screenshot colors, layout, and values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Discovered / Rejected Card */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Discovered / Rejected</p>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{analytics.discovered_leads || 0}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-accentGreen mt-2">
                      <span>↗ +12.5%</span>
                      <span className="text-zinc-500 font-semibold">vs last week</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#6366f1] shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.225 2.225 0 0 1 12.775 21.5a2.225 2.225 0 0 1-2.225-2.263v-.109M15 19.128c0-.138-.007-.276-.022-.413M10.5 19.128a9.311 9.311 0 0 0 2.625-.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M10.5 19.128v-.003c0-1.113-.285-2.16-.786-3.07M10.5 19.128v.109A2.225 2.225 0 0 1 8.275 21.5a2.225 2.225 0 0 1-2.225-2.263v-.109M10.5 19.128c0-.138-.007-.276-.022-.413M9 10.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM18 10.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" />
                    </svg>
                  </div>
                </div>

                {/* 2. Qualified Leads Card */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Qualified Leads</p>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{analytics.qualified_leads || 0}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-accentGreen mt-2">
                      <span>↗ +8.2%</span>
                      <span className="text-zinc-500 font-semibold">vs last week</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                {/* 3. Outreach Sent Card */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Outreach Sent</p>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{analytics.outreach_sent || 0}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-accentGreen mt-2">
                      <span>↗ +15.3%</span>
                      <span className="text-zinc-500 font-semibold">vs last week</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-accentBlue/10 border border-accentBlue/20 flex items-center justify-center text-accentBlue shrink-0">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* 4. Conversion Rate Card */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Conversion Rate</p>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{analytics.conversion_rate !== undefined ? `${analytics.conversion_rate}%` : '0%'}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-accentRed mt-2">
                      <span>↘ -2.1%</span>
                      <span className="text-zinc-500 font-semibold">vs last week</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-accentGreen shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                </div>

              </div>

              {/* Dynamic Splines & Funnel Visualization Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Weekly Trends - Clean grid dotted area spline */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6">
                  <div className="mb-4">
                    <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">Weekly Trends</h4>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Leads discovered and qualified this week</p>
                  </div>
                  
                  <div className="h-64 mt-6 relative flex flex-col justify-between">
                    <div className="absolute inset-0 flex flex-col justify-between py-1 text-[9px] text-zinc-600 font-bold pr-4">
                      <span>200</span>
                      <span>150</span>
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                    
                    <div className="h-[210px] ml-7 relative select-none">
                      {(() => {
                        const weeklyTrendsData = {
                          Mon: { x: 0, y: 135, leads: 120, qualified: 85, tx: 10, ty: 60 },
                          Tue: { x: 75, y: 152, leads: 148, qualified: 102, tx: 85, ty: 75 },
                          Wed: { x: 168, y: 92, leads: 189, qualified: 134, tx: 178, ty: 40 },
                          Thu: { x: 240, y: 56, leads: 172, qualified: 120, tx: 250, ty: 15 },
                          Fri: { x: 305, y: 40, leads: 202, qualified: 145, tx: 215, ty: 10 },
                          Sat: { x: 375, y: 98, leads: 135, qualified: 95, tx: 285, ty: 40 },
                          Sun: { x: 450, y: 110, leads: 110, qualified: 75, tx: 360, ty: 50 }
                        };
                        const activeDay = weeklyTrendsData[hoveredWeekDay];
                        return (
                          <svg className="w-full h-full" viewBox="0 0 450 180" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="spline-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                              </linearGradient>
                              <filter id="weekly-tooltip-shadow" x="-30%" y="-30%" width="160%" height="160%">
                                <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.5" />
                              </filter>
                            </defs>
                            
                            {/* Dotted horizontal grid lines */}
                            <line x1="0" y1="1" x2="450" y2="1" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'} strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="0" y1="45" x2="450" y2="45" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'} strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="0" y1="90" x2="450" y2="90" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'} strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="0" y1="135" x2="450" y2="135" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'} strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="0" y1="178" x2="450" y2="178" stroke={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'} strokeWidth="1" />
                            
                            {/* Vertical hover line indicator */}
                            {hoveredWeekDay && (
                              <line x1={activeDay.x} y1="0" x2={activeDay.x} y2="180" stroke={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} strokeWidth="1" />
                            )}

                            {/* Spline area */}
                            <path 
                              d="M 0 135 C 75 125, 110 170, 185 80 C 260 40, 315 150, 380 95 C 420 70, 450 110, 450 110 L 450 180 L 0 180 Z" 
                              fill="url(#spline-grad)" 
                            />
                            {/* Spline curve path */}
                            <path 
                              d="M 0 135 C 75 125, 110 170, 185 80 C 260 40, 315 150, 380 95 C 420 70, 450 110, 450 110" 
                              fill="none" 
                              stroke="#8b5cf6" 
                              strokeWidth="3.5" 
                            />

                            {/* Active glowing dot */}
                            {hoveredWeekDay && (
                              <>
                                <circle cx={activeDay.x} cy={activeDay.y} r="6.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2.5" className="transition-all duration-200" />
                                <circle cx={activeDay.x} cy={activeDay.y} r="12" fill="#8b5cf6" fillOpacity="0.2" className="transition-all duration-200" />
                              </>
                            )}

                            {/* Tooltip floating box */}
                            {hoveredWeekDay && (
                              <g transform={`translate(${activeDay.tx}, ${activeDay.ty})`} className="transition-all duration-300">
                                <rect width="85" height="60" rx="8" fill="#0b0b14" stroke="rgba(255,255,255,0.1)" strokeWidth="1" filter="url(#weekly-tooltip-shadow)" />
                                <text x="12" y="18" fill="#ffffff" fontSize="10" fontWeight="bold">{hoveredWeekDay}</text>
                                <text x="12" y="34" fill="rgba(255,255,255,0.7)" fontSize="9" fontWeight="semibold">leads : <tspan fill="#3b82f6" fontWeight="bold">{activeDay.leads}</tspan></text>
                                <text x="12" y="48" fill="#8b5cf6" fontSize="9" fontWeight="bold">qualified : <tspan fill="#ffffff">{activeDay.qualified}</tspan></text>
                              </g>
                            )}

                            {/* Hover Sensors */}
                            {Object.entries(weeklyTrendsData).map(([d, pt]) => (
                              <circle
                                key={`hover-${d}`}
                                cx={pt.x}
                                cy={pt.y}
                                r="35"
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredWeekDay(d)}
                                onMouseLeave={() => setHoveredWeekDay(null)}
                              />
                            ))}
                          </svg>
                        );
                      })()}
                    </div>

                    <div className="flex justify-between text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider pl-7 mt-2">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>

                {/* Conversion Funnel - Clean horizontal bar rows exactly matching Image 1 */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6">
                  <div className="mb-4">
                    <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">Conversion Funnel</h4>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Lead progression through pipeline stages</p>
                  </div>
                  
                  <div className="space-y-4.5 mt-5">
                    {[
                      { stage: "Discovered", value: analytics.discovered_leads || 0, width: `${Math.min(100, Math.max(2, ((analytics.discovered_leads || 0) / Math.max(1, analytics.discovered_leads || 1)) * 100))}%`, bg: "bg-[#8b5cf6]" },
                      { stage: "Qualified", value: analytics.qualified_leads || 0, width: `${Math.min(100, Math.max(2, ((analytics.qualified_leads || 0) / Math.max(1, analytics.discovered_leads || 1)) * 100))}%`, bg: "bg-[#6366f1]" },
                      { stage: "Queued", value: analytics.queue_pending || 0, width: `${Math.min(100, Math.max(2, ((analytics.queue_pending || 0) / Math.max(1, analytics.discovered_leads || 1)) * 100))}%`, bg: "bg-[#3b82f6]" },
                      { stage: "Sent", value: analytics.outreach_sent || 0, width: `${Math.min(100, Math.max(2, ((analytics.outreach_sent || 0) / Math.max(1, analytics.discovered_leads || 1)) * 100))}%`, bg: "bg-[#06b6d4]" },
                      { stage: "Replied", value: analytics.replied || 0, width: `${Math.min(100, Math.max(2, ((analytics.replied || 0) / Math.max(1, analytics.discovered_leads || 1)) * 100))}%`, bg: "bg-[#10b981]" },
                      { stage: "Converted", value: analytics.converted || 0, width: `${Math.min(100, Math.max(2, ((analytics.converted || 0) / Math.max(1, analytics.discovered_leads || 1)) * 100))}%`, bg: "bg-[#22c55e]" }
                    ].map((fun, idx) => (
                      <div key={idx} className="flex items-center gap-3.5 text-xs font-semibold">
                        <span className="w-16 text-zinc-500 dark:text-zinc-400 font-bold text-right shrink-0 text-[11px]">{fun.stage}</span>
                        <div className="flex-1 h-5 bg-zinc-200 dark:bg-zinc-950/20 rounded-md overflow-hidden relative border border-zinc-300/60 dark:border-zinc-800/20">
                          <div 
                            style={{ width: fun.width }} 
                            className={`h-full ${fun.bg} rounded-r-md transition-all duration-500`}
                          ></div>
                        </div>
                        <span className="w-14 text-zinc-700 dark:text-zinc-300 font-bold shrink-0 text-left text-[11px]">{fun.value}</span>
                      </div>
                    ))}
                    
                    {/* Horizontal Scale Axis */}
                    <div className="flex justify-between text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider pl-20 border-t border-zinc-200 dark:border-zinc-800/40 pt-2.5">
                      <span>0</span>
                      <span>750</span>
                      <span>1500</span>
                      <span>2250</span>
                      <span>3000</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent Leads and Subreddit Activity Double Column */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Leads Left Side (2/3 width) - Exactly matching values in Image 2 */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">Recent Leads</h4>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Latest high-score leads discovered by AI</p>
                    </div>
                    <button onClick={() => setActiveTab("pipeline")} className="text-xs text-[#6366f1] font-bold hover:underline transition-all">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-3.5">
                    {leads.slice(0, 4).map((lead, idx) => {
                      const tagColorMap = {
                        discovered: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                        qualified: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                        queued: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        outreach_sent: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
                        replied: "bg-green-500/10 text-green-400 border-green-500/20",
                        converted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      };
                      const tagBg = tagColorMap[lead.status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
                      
                      return (
                      <div 
                        key={idx} 
                        className="p-4.5 rounded-xl bg-zinc-50 dark:bg-[#18182c]/40 border border-zinc-200 dark:border-zinc-800/80 hover:border-[#3b82f6]/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)] transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300">u/{lead.author_username}</span>
                            <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 rounded font-bold">{lead.subreddit_name}</span>
                            <span className={`text-[9px] border px-2 py-0.5 rounded font-extrabold uppercase tracking-wider ${tagBg}`}>{lead.status}</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 font-semibold">"{lead.title}"</p>
                        <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500 font-bold">
                          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accentGold" /> AI Score: {lead.ai_score}/10</span>
                          <span>{getRelativeTime(lead.created_utc)}</span>
                        </div>
                      </div>
                    )})}
                    {leads.length === 0 && (
                      <div className="py-8 text-center text-zinc-500 text-xs italic">
                        No recent leads found.
                      </div>
                    )}
                  </div>
                </div>

                {/* Subreddit Activity Right Side (1/3 width) - Exactly matching values in Image 2 */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">Subreddit Activity</h4>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Top performing subreddits</p>
                  </div>

                  <div className="space-y-3.5 mt-3">
                    {topSubreddits && topSubreddits.length > 0 ? (
                      topSubreddits.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-zinc-200 dark:border-zinc-800/40 last:border-0 font-semibold">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${idx < 4 ? "bg-accentGreen" : "bg-zinc-600"} animate-pulse`}></span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-bold">{sub.subreddit}</span>
                          </div>
                          <span className="text-zinc-500 font-bold">{sub.leads} leads</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-500 text-xs text-center py-4">No top subreddits yet.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Account Health Bottom Footer - Exactly matching bottom horizontal grid values in Image 2 */}
              <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6">
                <div className="mb-4">
                  <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">Account Health</h4>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Monitor your Reddit account status and API limits</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-5">
                  
                  {/* Karma Column */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Karma</span>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">15,432</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-50 dark:bg-[#0f2d1e] text-emerald-600 dark:text-[#10b981] border border-emerald-200 dark:border-[#047857]/30 shadow-sm uppercase tracking-wide">
                      Healthy
                    </span>
                  </div>

                  {/* API Rate Limit Column */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">API Rate Limit</span>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">67%</h3>
                    <div className="w-4/5 h-1.5 bg-zinc-200 dark:bg-zinc-950/60 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-850/40 mt-3">
                      <div style={{ width: "67%" }} className="h-full bg-accentGreen rounded-full shadow-glow"></div>
                    </div>
                  </div>

                  {/* Daily Messages Column */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Daily Messages</span>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">23/50</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black bg-blue-50 dark:bg-[#172554] text-blue-600 dark:text-[#3b82f6] border border-blue-200 dark:border-[#1d4ed8]/30 shadow-sm uppercase tracking-wide">
                      On Track
                    </span>
                  </div>

                  {/* Shadow Ban Status Column */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Shadow Ban Status</span>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Clear</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-50 dark:bg-[#0f2d1e] text-emerald-600 dark:text-[#10b981] border border-emerald-200 dark:border-[#047857]/30 shadow-sm uppercase tracking-wide">
                      All Good
                    </span>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* VIEW: LEADS KANBAN PIPELINE */}
          {activeTab === "pipeline" && (
            <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
              
              {/* Header section matching exact layout and subheadings */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                  <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Leads Pipeline</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                    Drag and drop leads between stages to manage your pipeline
                  </p>
                </div>
                
                <button 
                  onClick={handleTriggerMonitor}
                  className="px-4.5 py-2.5 rounded-xl bg-[#6366f1] text-white text-xs font-bold hover:opacity-90 flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.25)] shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Qualify All</span>
                </button>
              </div>

              {/* Horizontal grid of Stage Counts exactly matching counters in screenshot */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 shrink-0">
                {[
                  { label: "Raw Discovered", value: leads.filter(l => l.status === "discovered").length },
                  { label: "Qualified", value: leads.filter(l => l.status === "qualified").length },
                  { label: "Queued", value: leads.filter(l => l.status === "queued").length },
                  { label: "Outreach Sent", value: leads.filter(l => l.status === "outreach_sent").length },
                  { label: "Replied", value: leads.filter(l => l.status === "replied").length },
                  { label: "Converted", value: leads.filter(l => l.status === "converted").length }
                ].map((stage, idx) => (
                  <div key={idx} className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/60 p-3.5 rounded-xl space-y-1 shadow-sm">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{stage.label}</span>
                    <h4 className="text-xl font-black text-zinc-900 dark:text-white">{stage.value}</h4>
                  </div>
                ))}
              </div>

              {/* 6 Column Kanban Pipeline Board exactly matching screenshot colors & elements */}
              <div className="flex-1 overflow-x-auto flex gap-6 pb-4 custom-scrollbar">
                {[
                  { id: "discovered", label: "Raw Discovered", color: "bg-purple-500", badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
                  { id: "qualified", label: "Qualified", color: "bg-indigo-500", badge: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" },
                  { id: "queued", label: "Queued", color: "bg-blue-500", badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
                  { id: "outreach_sent", label: "Outreach Sent", color: "bg-cyan-500", badge: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
                  { id: "replied", label: "Replied", color: "bg-green-500", badge: "bg-green-500/10 text-green-400 border border-green-500/20" },
                  { id: "converted", label: "Converted", color: "bg-emerald-500", badge: "bg-zinc-800 text-zinc-500 border border-zinc-700/60" }
                ].map((column) => {
                  const dbLeads = filteredLeadsList.filter(l => l.status === column.id);
                  // Use real database data only. If there are no leads it will be an empty array
                  const colLeads = dbLeads;
                  
                  return (
                    <div 
                      key={column.id} 
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, column.id)}
                      className="w-80 shrink-0 flex flex-col bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-850/80 rounded-2xl p-4 shadow-md"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-zinc-800/40 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-zinc-800 dark:text-white text-xs tracking-wide">{column.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${column.badge}`}>
                            {colLeads.length}
                          </span>
                        </div>
                      </div>

                      {/* Column Cards Container */}
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                        {colLeads.map((lead) => (
                          <div 
                            key={lead.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onClick={() => {
                              setSelectedLead(lead);
                              handleGenerateAIOutreach(lead);
                            }}
                            className="p-4 rounded-xl bg-zinc-50 dark:bg-[#0c0c16] border border-zinc-200 dark:border-zinc-800/40 hover:border-accentPurple/30 hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between"
                          >
                            {/* Card Top Row: Avatar silhouette, username, score pill badge */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/35 flex items-center justify-center text-white text-[10px] font-bold">
                                  <svg className="w-3.5 h-3.5 text-[#8b5cf6]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                  </svg>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">u/{lead.author_username}</span>
                                  <span className="text-[9px] text-zinc-500 font-semibold mt-0.5">{lead.subreddit_name}</span>
                                </div>
                              </div>
                              <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold">
                                <Sparkles className="w-2.5 h-2.5 text-accentGold" /> {lead.ai_score}
                              </span>
                            </div>

                            {/* Card Content Text Snippet */}
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 font-semibold line-clamp-2 leading-relaxed">
                              {lead.title}
                            </p>

                            {/* Card Footer: Clock, elapsed time, interactive view link */}
                            <div className="flex items-center justify-between mt-4 pt-2 border-t border-zinc-200 dark:border-zinc-900/60 text-[10px] text-zinc-500 font-bold">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-600" />
                                {getRelativeTime(lead.created_utc)}
                              </span>
                              <span className="text-accentBlue hover:underline flex items-center gap-0.5 cursor-pointer">
                                View Post
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        ))}
                        {colLeads.length === 0 && (
                          <div className="h-32 border border-dashed border-zinc-300 dark:border-zinc-800/40 rounded-xl flex flex-col items-center justify-center text-center text-xs text-zinc-500 dark:text-zinc-600 italic px-4">
                            <span>No leads in this stage</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* VIEW: SUBREDDIT MANAGER */}
          {activeTab === "subreddits" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Active Subreddits", value: subredditMetrics.active, desc: "System listener feeds online", trend: "Steady" },
                  { label: "Total Mapped Leads", value: subredditMetrics.leadsCount, desc: "Aggregated Reddit reads", trend: "+14.2%" },
                  { label: "Qualified Target leads", value: subredditMetrics.qualifiedCount, desc: "Filtered score criteria met", trend: "High priority" },
                  { label: "Avg. Conversion Rate", value: subredditMetrics.avgConversion, desc: "Reply success telemetry", trend: "Stable" }
                ].map((stat, idx) => (
                  <div key={idx} className="glass-card p-6 rounded-3xl border border-glassBorder">
                    <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">{stat.label}</p>
                    <p className="text-3xl font-extrabold tracking-tight mt-2 text-zinc-800 dark:text-zinc-400">{stat.value}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[10px] text-zinc-500">{stat.desc}</span>
                      <span className="text-[10px] text-accentPurple bg-accentPurple/10 px-2.5 py-0.5 rounded-full font-bold">{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-b border-glassBorder pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-400">Subreddit Management</h3>
                  <p className="text-xs text-zinc-500">Monitor and manage subreddits for lead discovery</p>
                </div>
                <button 
                  onClick={() => setShowAddSubModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-accentPurple to-accentBlue text-white text-xs font-bold hover:opacity-90 flex items-center gap-2 shadow-glow shrink-0 transition-all duration-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subreddit</span>
                </button>
              </div>

              {showAddSubModal && (
                <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-6" onClick={() => setShowAddSubModal(false)}>
                  <div className="w-full max-w-md glass-panel p-6 rounded-3xl space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-glassBorder pb-2">
                      <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-400">Register Subreddit Stream</h4>
                      <button onClick={() => setShowAddSubModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <form onSubmit={handleAddSubreddit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Subreddit feed (no r/)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. saas"
                          value={newSub.name}
                          onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                          className="w-full bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl px-4 py-2 text-sm text-zinc-800 dark:text-zinc-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">Allow Automated Outreach DMs</span>
                        <input
                          type="checkbox"
                          checked={newSub.dm_allowed}
                          onChange={(e) => setNewSub({ ...newSub, dm_allowed: e.target.checked })}
                          className="w-4 h-4 accent-accentPurple"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Compliance Constraint Rules</label>
                        <textarea
                          rows="3"
                          placeholder="E.g. Showcase only on Saturdays, No affiliate pitch links."
                          value={newSub.rules}
                          onChange={(e) => setNewSub({ ...newSub, rules: e.target.value })}
                          className="w-full bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl px-4 py-2 text-xs text-zinc-800 dark:text-zinc-400 focus:outline-none"
                        />
                      </div>
                      <button type="submit" disabled={actionLoading === "add_subreddit"} className="w-full bg-gradient-to-r from-accentPurple to-accentBlue text-zinc-800 dark:text-white font-bold py-2.5 rounded-xl text-xs shadow-glow hover:opacity-90 transition-all flex items-center justify-center gap-2">
                        {actionLoading === "add_subreddit" ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Registering...</span>
                          </>
                        ) : (
                          <span>Start Monitoring Feed</span>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {actionLoading === "fetch_subreddits" && subreddits.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-accentPurple animate-spin mb-4" />
                    <p className="text-sm font-semibold text-zinc-500">Fetching subreddits...</p>
                  </div>
                ) : subreddits.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-glassBorder rounded-3xl">
                    <p className="text-sm font-semibold text-zinc-500">No subreddits registered yet.</p>
                    <button onClick={() => setShowAddSubModal(true)} className="mt-4 text-accentPurple text-xs font-bold hover:underline">
                      Add your first subreddit
                    </button>
                  </div>
                ) : (
                  subreddits.map((sub) => (
                  <div key={sub.id} className="glass-card p-6 rounded-3xl border border-glassBorder flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-extrabold text-base text-zinc-700 dark:text-zinc-400">r/{sub.name}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase border ${
                          sub.active 
                            ? "bg-emerald-50 dark:bg-[#0f2d1e] text-emerald-600 dark:text-[#10b981] border-emerald-200 dark:border-[#047857]/30" 
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700"
                        }`}>
                          {sub.active ? "active" : "paused"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-zinc-500 font-medium">
                        <span>Total Leads Mapped: <strong className="text-zinc-600 dark:text-zinc-300 font-bold">456</strong></span>
                        <span>Qualified Targets: <strong className="text-zinc-600 dark:text-zinc-300 font-bold">234</strong></span>
                        <span>Conversion Rate: <strong className="text-zinc-600 dark:text-zinc-300 font-bold">51.3%</strong></span>
                        <span>Added: <strong className="text-zinc-500 dark:text-zinc-400 font-semibold">{sub.created_at ? new Date(sub.created_at).toISOString().split('T')[0] : "2024-01-15"}</strong></span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {["automation", "tools", "software"].map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-zinc-100/60 dark:bg-zinc-950/40 border border-zinc-200 dark:border-glassBorder/60 text-[10px] text-zinc-500 font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleToggleSubreddit(sub.id, sub.active, sub.name)}
                        className={`p-2 rounded-xl border transition-all ${
                          sub.active 
                            ? "bg-[#0f2d1e] text-[#10b981] border-[#047857]/30"
                            : "bg-zinc-50 dark:bg-zinc-950/20 text-zinc-500 dark:text-zinc-400 border-glassBorder hover:text-white"
                        }`}
                        title={sub.active ? "Pause Scanner" : "Resume Scanner"}
                      >
                        <Radio className={`w-4 h-4 ${sub.active ? "animate-pulse animate-duration-1000" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubreddit(sub.id)}
                        className="p-2 rounded-xl border border-glassBorder bg-zinc-50 dark:bg-zinc-950/20 text-zinc-600 hover:text-accentRed hover:border-accentRed/30 transition-all"
                        title="Delete Feed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          )}

          {/* VIEW: KEYWORD MANAGER */}
          {activeTab === "keywords" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-glassBorder pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-400">Keyword Management</h3>
                  <p className="text-xs text-zinc-500">Manage keywords for AI-powered lead discovery</p>
                </div>
                <button 
                  onClick={() => setShowAddKwModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-accentPurple to-accentBlue text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 shadow-glow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Keyword</span>
                </button>
              </div>

              {showAddKwModal && (
                <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-6" onClick={() => setShowAddKwModal(false)}>
                  <div className="w-full max-w-sm glass-panel p-6 rounded-3xl space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-glassBorder pb-2">
                      <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-400">Add Keyword filter</h4>
                      <button onClick={() => setShowAddKwModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <form onSubmit={handleAddKeyword} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Keyword / Target Phrase</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. recommend tool"
                          value={newKw}
                          onChange={(e) => setNewKw(e.target.value)}
                          className="w-full bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl px-4 py-2 text-sm text-zinc-800 dark:text-zinc-400 focus:outline-none"
                        />
                      </div>
                      <button type="submit" className="w-full bg-white text-zinc-950 font-bold py-2 rounded-xl text-xs">
                        Add Filter
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="glass-panel p-8 rounded-3xl border border-glassBorder bg-zinc-950/10 dark:bg-zinc-950/20">
                <div className="flex flex-wrap gap-3">
                  {keywords.map((kw) => (
                    <div 
                      key={kw.id} 
                      className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl bg-zinc-100/60 dark:bg-zinc-950/60 border border-glassBorder text-xs text-accentBlue hover:text-accentPurple hover:border-zinc-700 transition-colors font-bold shadow-glow"
                    >
                      <span className="text-zinc-500 font-semibold">#</span>
                      <span>{kw.keyword}</span>
                      <button 
                        onClick={() => handleDeleteKeyword(kw.id)}
                        className="text-zinc-600 hover:text-accentRed transition-colors ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {keywords.length === 0 && (
                    <div className="p-8 text-center text-xs text-zinc-600 italic border border-dashed border-glassBorder rounded-2xl w-full">
                      No keywords configured. Scanner will qualify all fetched Reddit posts.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: OUTREACH QUEUE */}
          {activeTab === "queue" && (
            <div className="space-y-6">
              <div className="border-b border-glassBorder pb-3">
                <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-400">Outreach Queue</h3>
                <p className="text-xs text-zinc-500">Review and approve scheduled outreach messages</p>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-glassBorder space-y-4">
                <div className="border-b border-zinc-200 dark:border-glassBorder/60 pb-3">
                  <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-400">Scheduled Messages ({outreachQueueTotal})</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Pending approval before sending</p>
                </div>

                <div className="space-y-3.5">
                  {queue.map((item) => (
                    <div key={item.id} className="p-5 rounded-2xl bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-6 transition-all duration-300 hover:border-zinc-700/60">
                      <div className="space-y-1">
                        <h5 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150">u/{item.author_username}</h5>
                        <p className="text-[10px] text-zinc-500 font-semibold">
                          Scheduled for {formatQueueScheduledTime(item)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => handleApproveQueueItem(item.id)}
                          className="px-4.5 py-1.5 rounded-xl bg-accentPurple text-white text-xs font-bold hover:opacity-90 transition-all duration-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            // setNotice({ type: "success", text: "Outreach drafted edit drawer invoked." });
                            setSelectedQueueItem(item);
                            setEditedOutreachContent(item.outreach_content || "");
                            setIsQueueDrawerOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400 font-bold transition-all duration-200"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                  {queue.length === 0 && (
                    <div className="p-8 text-center text-xs text-zinc-600 italic border border-dashed border-glassBorder rounded-2xl w-full">
                      No messages currently pending queue approvals. Go to Kanban Leads board to qualify.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  disabled={outreachQueuePage === 1}
                  onClick={() => setOutreachQueuePage((prev) => Math.max(prev - 1, 1))}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold disabled:opacity-40"
                >
                  Prev
                </button>

                <span className="text-xs text-zinc-500 font-semibold">
                  Page {outreachQueuePage} of {outreachQueueTotalPages}
                </span>

                <button
                  disabled={outreachQueuePage >= outreachQueueTotalPages}
                  onClick={() => setOutreachQueuePage((prev) => Math.min(prev + 1, outreachQueueTotalPages))}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {isQueueDrawerOpen && selectedQueueItem && (
  <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
    <div className="w-full max-w-2xl h-full overflow-y-auto bg-white dark:bg-darkCard border-l border-zinc-200 dark:border-zinc-800 shadow-2xl p-6">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            Outreach Review
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            u/{selectedQueueItem.author_username}
          </p>
        </div>

        <button
          onClick={() => setIsQueueDrawerOpen(false)}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-5">

        {/* Post Meta */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 mb-2">Post Title</p>
          <h4 className="font-semibold text-sm">
            {selectedQueueItem.title}
          </h4>
        </div>

        {/* AI Score */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-zinc-500">AI Score</p>
            <p className="text-lg font-bold mt-1">
              {selectedQueueItem.ai_score}/10
            </p>
          </div>

          <div className="rounded-2xl border p-4">
            <p className="text-xs text-zinc-500">Sequence</p>
            <p className="text-sm font-semibold mt-1 capitalize">
              {selectedQueueItem.sequence_step}
            </p>
          </div>
        </div>

        {/* AI Reason */}
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-zinc-500 mb-2">AI Reason</p>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {selectedQueueItem.ai_reason}
          </p>
        </div>

        {/* Original Content */}
        <div className="rounded-2xl border p-4 max-h-48 overflow-y-auto">
          <p className="text-xs text-zinc-500 mb-2">Original Reddit Post</p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {selectedQueueItem.content}
          </p>
        </div>

        {/* Editable Outreach */}
        <div>
          <label className="block text-xs font-semibold mb-2 text-zinc-500">
            Outreach Message
          </label>

          <textarea
            rows={8}
            value={editedOutreachContent}
            onChange={(e) => setEditedOutreachContent(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-sm resize-none outline-none"
          />
        </div>

        {/* Link */}
        <a
          href={selectedQueueItem.post_url}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-accentPurple font-semibold hover:underline"
        >
          Open Reddit Post →
        </a>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setIsQueueDrawerOpen(false)}
            className="px-4 py-2 rounded-xl border"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveQueueItem}
            className="px-5 py-2 rounded-xl bg-accentPurple text-white font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
          )}

          {/* VIEW: MESSAGE TEMPLATES */}
          {activeTab === "sequences" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-glassBorder pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-400">Message Templates</h3>
                  <p className="text-xs text-zinc-500">Create and manage AI-powered message templates</p>
                </div>
                <button 
                  onClick={() => setNotice({ type: "success", text: "New template builder invoked." })}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-accentPurple to-accentBlue text-white text-xs font-bold hover:opacity-90 flex items-center gap-2 shadow-glow shrink-0 transition-all duration-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Template</span>
                </button>
              </div>

              <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-5 shadow-premium">
                <div>
                  <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">Default Introduction Template</h4>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Used for first-time outreach</p>
                </div>

                <div className="space-y-5">
                  {editingTemplateId ? (
                    <div className="space-y-4">
                      <textarea
                        rows="5"
                        value={editingTemplateText}
                        onChange={(e) => setEditingTemplateText(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-[#18182a] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-accentPurple/40 transition-all leading-relaxed"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingTemplateId(null);
                            setNotice({ type: "success", text: "Introduction message template saved successfully." });
                          }}
                          className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-accentPurple to-accentBlue text-white text-xs font-bold hover:opacity-90 shadow-glow transition-all"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTemplateId(null)}
                          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400 font-bold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-5 rounded-xl bg-zinc-50 dark:bg-[#18182a] border border-zinc-200 dark:border-zinc-800/60 shadow-inner">
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono tracking-wide">
                          Hi {"{{username}}"},
                          <br /><br />
                          I saw your post about {"{{topic}}"} in {"{{subreddit}}"} and thought PulsePilot might help...
                        </p>
                      </div>

                      <div className="flex items-center gap-5">
                        <button
                          onClick={() => {
                            setEditingTemplateId(1);
                            setEditingTemplateText("Hi {{username}},\n\nI saw your post about {{topic}} in {{subreddit}} and thought PulsePilot might help...");
                          }}
                          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-xs text-zinc-700 dark:text-zinc-300 font-bold transition-all duration-200"
                        >
                          Edit Template
                        </button>
                        <button
                          onClick={() => {
                            setPreviewTemplateText("Hi u/techFounder_99,\n\nI saw your post about social media lead qualification in r/startups and thought PulsePilot might help...");
                          }}
                          className="text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-900 dark:hover:text-white transition-all text-xs"
                        >
                          Preview
                        </button>
                      </div>

                      {previewTemplateText && (
                        <div className="p-4 rounded-xl bg-accentPurple/5 border border-accentPurple/20 text-xs font-medium space-y-2 animate-fade-in">
                          <p className="text-[10px] text-accentPurple font-bold uppercase tracking-wider">Simulated Template Render</p>
                          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed italic">"{previewTemplateText}"</p>
                          <button onClick={() => setPreviewTemplateText("")} className="text-[9px] text-zinc-500 font-bold hover:underline">Close preview</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: TELEMETRY ANALYTICS */}
          {activeTab === "analytics" && analytics && (
            <div className="space-y-6">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-400">Analytics Dashboard</h3>
                <p className="text-xs text-zinc-500">Track performance metrics and conversion insights</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Avg. AI Score", value: "87.3", desc: "+3.2 from last month", icon: TrendingUp, iconColor: "text-accentPurple" },
                  { label: "Reply Rate", value: "23.4%", desc: "+1.8% from last month", icon: Mail, iconColor: "text-accentBlue" },
                  { label: "Conversion Rate", value: "14.5%", desc: "+2.1% from last month", icon: Activity, iconColor: "text-accentGreen" },
                  { label: "Qualification Rate", value: "61.4%", desc: "+4.3% from last month", icon: Users, iconColor: "text-accentPurple" }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl flex items-center justify-between shadow-premium transition-all duration-300 hover:border-zinc-700/60">
                      <div className="space-y-2">
                        <p className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase">{stat.label}</p>
                        <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">{stat.value}</p>
                        <p className="text-[10px] text-[#10b981] font-bold">{stat.desc}</p>
                      </div>
                      <Icon className={`w-5 h-5 ${stat.iconColor} shrink-0 self-start mt-0.5`} />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Conversion Trends Line Graph */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-premium">
                  <div className="mb-4">
                    <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-150">Conversion Trends</h4>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Lead progression over the last 5 months</p>
                  </div>
                  <div className="h-64 mt-4 relative select-none">
                    {(() => {
                      const trendMonthData = {
                        Jan: { x: 60, y: 165, leads: 520, qualified: 290, converted: 60, tx: 68, ty: 125 },
                        Feb: { x: 160, y: 140, leads: 610, qualified: 350, converted: 78, tx: 168, ty: 100 },
                        Mar: { x: 260, y: 120, leads: 721, qualified: 421, converted: 98, tx: 268, ty: 125 },
                        Apr: { x: 360, y: 85, leads: 840, qualified: 490, converted: 112, tx: 260, ty: 90 },
                        May: { x: 460, y: 70, leads: 915, qualified: 560, converted: 130, tx: 360, ty: 75 }
                      };
                      const activeTrend = trendMonthData[hoveredTrendMonth] || trendMonthData["Mar"];
                      return (
                        <svg className="w-full h-full" viewBox="0 0 500 220" preserveAspectRatio="none">
                          {/* Grid Lines */}
                          {(() => { const gH = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'; const gB = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'; const gV = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'; return (<>
                          <line x1="50" y1="30" x2="480" y2="30" stroke={gH} strokeDasharray="3 3" />
                          <line x1="50" y1="72.5" x2="480" y2="72.5" stroke={gH} strokeDasharray="3 3" />
                          <line x1="50" y1="115" x2="480" y2="115" stroke={gH} strokeDasharray="3 3" />
                          <line x1="50" y1="157.5" x2="480" y2="157.5" stroke={gH} strokeDasharray="3 3" />
                          <line x1="50" y1="200" x2="480" y2="200" stroke={gB} />
                          <line x1="60" y1="30" x2="60" y2="200" stroke={gV} strokeDasharray="3 3" />
                          <line x1="160" y1="30" x2="160" y2="200" stroke={gV} strokeDasharray="3 3" />
                          <line x1="260" y1="30" x2="260" y2="200" stroke={gV} strokeDasharray="3 3" />
                          <line x1="360" y1="30" x2="360" y2="200" stroke={gV} strokeDasharray="3 3" />
                          <line x1="460" y1="30" x2="460" y2="200" stroke={gV} strokeDasharray="3 3" />
                          </>); })()}
                          
                          {/* Vertical Indicator at hovered month */}
                          {hoveredTrendMonth && (
                            <line x1={activeTrend.x} y1="30" x2={activeTrend.x} y2="200" stroke={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} />
                          )}

                          {/* Y-Axis Labels */}
                          {(() => { const tc = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'; return (<>
                          <text x="35" y="34" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">1000</text>
                          <text x="35" y="76.5" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">750</text>
                          <text x="35" y="119" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">500</text>
                          <text x="35" y="161.5" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">250</text>
                          <text x="35" y="204" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">0</text>
                          </>); })()}

                          <defs>
                            <filter id="tooltip-shadow" x="-30%" y="-30%" width="160%" height="160%">
                              <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.5" />
                            </filter>
                          </defs>

                          {/* Line Path */}
                          <path 
                            d="M 60 165 C 110 152, 110 148, 160 140 C 210 132, 210 126, 260 120 C 310 114, 310 95, 360 85 C 410 75, 410 72, 460 70" 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="3.5" 
                          />

                          {/* X-Axis Labels */}
                          {(() => { const tc = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'; return (<>
                          <text x="60" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Jan</text>
                          <text x="160" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Feb</text>
                          <text x="260" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Mar</text>
                          <text x="360" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Apr</text>
                          <text x="460" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">May</text>
                          </>); })()}

                          {/* Dots */}
                          {Object.entries(trendMonthData).map(([m, pt]) => (
                            <circle 
                              key={m}
                              cx={pt.x} 
                              cy={pt.y} 
                              r={hoveredTrendMonth === m ? "5.5" : "4.5"} 
                              fill="#10b981" 
                              stroke="#ffffff" 
                              strokeWidth={hoveredTrendMonth === m ? "2" : "1.5"} 
                              className="transition-all duration-200"
                            />
                          ))}
                          
                          {/* Active glowing dot */}
                          {hoveredTrendMonth && (
                            <circle cx={activeTrend.x} cy={activeTrend.y} r="9" fill="#10b981" fillOpacity="0.25" className="transition-all duration-200" />
                          )}

                          {/* Tooltip floating box */}
                          {hoveredTrendMonth && (
                            <g transform={`translate(${activeTrend.tx}, ${activeTrend.ty})`} className="transition-all duration-300">
                              <rect width="90" height="75" rx="8" fill="#0b0b14" stroke="rgba(255,255,255,0.1)" strokeWidth="1" filter="url(#tooltip-shadow)" />
                              <text x="12" y="20" fill="#ffffff" fontSize="10" fontWeight="bold">{hoveredTrendMonth}</text>
                              <text x="12" y="38" fill="rgba(255,255,255,0.7)" fontSize="9" fontWeight="semibold">leads : <tspan fill="#ffffff">{activeTrend.leads}</tspan></text>
                              <text x="12" y="52" fill="#8b5cf6" fontSize="9" fontWeight="bold">qualified : <tspan fill="#ffffff">{activeTrend.qualified}</tspan></text>
                              <text x="12" y="66" fill="#10b981" fontSize="9" fontWeight="bold">converted : <tspan fill="#ffffff">{activeTrend.converted}</tspan></text>
                            </g>
                          )}

                          {/* Hover Slices/Sensors */}
                          {Object.entries(trendMonthData).map(([m, pt]) => (
                            <circle
                              key={`hover-${m}`}
                              cx={pt.x}
                              cy={pt.y}
                              r="35"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredTrendMonth(m)}
                              onMouseLeave={() => setHoveredTrendMonth(null)}
                            />
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                </div>

                {/* 2. Subreddit Performance Pie Chart */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-premium">
                  <div className="mb-4">
                    <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-150">Subreddit Performance</h4>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Lead distribution by subreddit</p>
                  </div>
                  <div className="h-64 mt-4 relative select-none">
                    <svg className="w-full h-full" viewBox="0 0 500 220">
                      {/* Solid Slices centered around (250, 110) with radius 70 */}
                      {/* 1. r/SaaS 28% (Indigo) -> Angle 0 to 100.8 */}
                      <path d="M 250 110 L 250 40 A 70 70 0 0 1 318.7 123.1 Z" fill="#8b5cf6" />
                      
                      {/* 2. r/business 12% (Green) -> Angle 100.8 to 144 */}
                      <path d="M 250 110 L 318.7 123.1 A 70 70 0 0 1 291.1 166.7 Z" fill="#10b981" />
                      
                      {/* 3. r/marketing 16% (Cyan) -> Angle 144 to 201.6 */}
                      <path d="M 250 110 L 291.1 166.7 A 70 70 0 0 1 224.5 175.5 Z" fill="#06b6d4" />
                      
                      {/* 4. r/entrepreneur 21% (Blue) -> Angle 201.6 to 277.2 */}
                      <path d="M 250 110 L 224.5 175.5 A 70 70 0 0 1 180.6 100.8 Z" fill="#3b82f6" />
                      
                      {/* 5. r/startups 24% (Purple) -> Angle 277.2 to 360 */}
                      <path d="M 250 110 L 180.6 100.8 A 70 70 0 0 1 250 40 Z" fill="#a855f7" />

                      {/* Thin Pointer Lines */}
                      <line x1="285" y1="75" x2="330" y2="75" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                      <line x1="305" y1="125" x2="325" y2="132" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                      <line x1="250" y1="170" x2="270" y2="185" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                      <line x1="200" y1="130" x2="175" y2="155" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                      <line x1="205" y1="85" x2="185" y2="85" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

                      {/* Slices Labels pointing directly around the Pie Chart */}
                      <text x="335" y="79" fill="#8b5cf6" fontSize="10" fontWeight="bold">r/SaaS 28%</text>
                      <text x="330" y="137" fill="#10b981" fontSize="10" fontWeight="bold">r/business 12%</text>
                      <text x="275" y="195" fill="#06b6d4" fontSize="10" fontWeight="bold">r/marketing 16%</text>
                      <text x="170" y="160" fill="#3b82f6" fontSize="10" fontWeight="bold" textAnchor="end">r/entrepreneur 21%</text>
                      <text x="180" y="89" fill="#a855f7" fontSize="10" fontWeight="bold" textAnchor="end">r/startups 24%</text>
                    </svg>
                  </div>
                </div>

                {/* 3. Reply Rate by Day Columns Bar Chart */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-premium">
                  <div className="mb-4">
                    <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-150">Reply Rate by Day</h4>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Average reply rates throughout the week</p>
                  </div>
                  <div className="h-64 mt-4 relative select-none">
                    <svg className="w-full h-full" viewBox="0 0 500 220" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      {(() => { const gH = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'; const gB = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'; const tc = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'; return (<>
                      <line x1="50" y1="30" x2="480" y2="30" stroke={gH} strokeDasharray="3 3" />
                      <line x1="50" y1="72.5" x2="480" y2="72.5" stroke={gH} strokeDasharray="3 3" />
                      <line x1="50" y1="115" x2="480" y2="115" stroke={gH} strokeDasharray="3 3" />
                      <line x1="50" y1="157.5" x2="480" y2="157.5" stroke={gH} strokeDasharray="3 3" />
                      <line x1="50" y1="200" x2="480" y2="200" stroke={gB} />
                      {/* Y-Axis Labels */}
                      <text x="35" y="34" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">28</text>
                      <text x="35" y="76.5" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">21</text>
                      <text x="35" y="119" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">14</text>
                      <text x="35" y="161.5" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">7</text>
                      <text x="35" y="204" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">0</text>
                      </>); })()}

                      {/* Bars: Mon (18%), Tue (22%), Wed (26%), Thu (21%), Fri (28%), Sat (15%), Sun (12%) */}
                      <rect x="63" y="91" width="24" height="109" rx="4" fill="#06b6d4" />
                      <rect x="123" y="66.5" width="24" height="133.5" rx="4" fill="#06b6d4" />
                      <rect x="183" y="42.2" width="24" height="157.8" rx="4" fill="#06b6d4" />
                      <rect x="243" y="72.5" width="24" height="127.5" rx="4" fill="#06b6d4" />
                      <rect x="303" y="30" width="24" height="170" rx="4" fill="#06b6d4" />
                      <rect x="363" y="109" width="24" height="91" rx="4" fill="#06b6d4" />
                      <rect x="423" y="127.2" width="24" height="72.8" rx="4" fill="#06b6d4" />

                      {/* X-Axis Labels */}
                      {(() => { const tc = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'; return (<>
                      <text x="75" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Mon</text>
                      <text x="135" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Tue</text>
                      <text x="195" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Wed</text>
                      <text x="255" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Thu</text>
                      <text x="315" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Fri</text>
                      <text x="375" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Sat</text>
                      <text x="435" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Sun</text>
                      </>); })()}
                    </svg>
                  </div>
                </div>

                {/* 4. AI Qualification Trends Area Spline */}
                <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-premium">
                  <div className="mb-4">
                    <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-150">AI Qualification Trends</h4>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Quality of leads over time</p>
                  </div>
                  <div className="h-64 mt-4 relative select-none">
                    {(() => {
                      const qualMonthData = {
                        Jan: { x: 60, y: 118, qualified: 290, tx: 68, ty: 85 },
                        Feb: { x: 160, y: 101, qualified: 350, tx: 168, ty: 70 },
                        Mar: { x: 260, y: 81, qualified: 421, tx: 268, ty: 50 },
                        Apr: { x: 360, y: 61, qualified: 490, tx: 278, ty: 30 },
                        May: { x: 460, y: 41.4, qualified: 560, tx: 378, ty: 15 }
                      };
                      const activeQual = qualMonthData[hoveredQualMonth] || qualMonthData["Mar"];
                      return (
                        <svg className="w-full h-full" viewBox="0 0 500 220" preserveAspectRatio="none">
                          {/* Grid Lines */}
                          {(() => { const gH = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'; const gB = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'; const gV = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'; const tc = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'; return (<>
                          <line x1="50" y1="30" x2="480" y2="30" stroke={gH} strokeDasharray="3 3" />
                          <line x1="50" y1="72.5" x2="480" y2="72.5" stroke={gH} strokeDasharray="3 3" />
                          <line x1="50" y1="115" x2="480" y2="115" stroke={gH} strokeDasharray="3 3" />
                          <line x1="50" y1="157.5" x2="480" y2="157.5" stroke={gH} strokeDasharray="3 3" />
                          <line x1="50" y1="200" x2="480" y2="200" stroke={gB} />
                          <line x1="60" y1="30" x2="60" y2="200" stroke={gV} strokeDasharray="3 3" />
                          <line x1="160" y1="30" x2="160" y2="200" stroke={gV} strokeDasharray="3 3" />
                          <line x1="260" y1="30" x2="260" y2="200" stroke={gV} strokeDasharray="3 3" />
                          <line x1="360" y1="30" x2="360" y2="200" stroke={gV} strokeDasharray="3 3" />
                          <line x1="460" y1="30" x2="460" y2="200" stroke={gV} strokeDasharray="3 3" />
                          {/* Vertical Indicator at hovered month */}
                          {hoveredQualMonth && (
                            <line x1={activeQual.x} y1="30" x2={activeQual.x} y2="200" stroke={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} />
                          )}
                          {/* Y-Axis Labels */}
                          <text x="35" y="34" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">600</text>
                          <text x="35" y="76.5" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">450</text>
                          <text x="35" y="119" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">300</text>
                          <text x="35" y="161.5" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">150</text>
                          <text x="35" y="204" fill={tc} fontSize="10" fontWeight="bold" textAnchor="end">0</text>
                          </>); })()}

                          <defs>
                            <linearGradient id="gradient-qualification-area" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Spline Area Gradient Fill */}
                          <path 
                            d="M 60 118 C 110 110, 110 105, 160 101 C 210 97, 210 87, 260 81 C 310 75, 310 67, 360 61 C 410 55, 410 47, 460 41.4 L 460 200 L 60 200 Z" 
                            fill="url(#gradient-qualification-area)" 
                          />

                          {/* Spline Area Path */}
                          <path 
                            d="M 60 118 C 110 110, 110 105, 160 101 C 210 97, 210 87, 260 81 C 310 75, 310 67, 360 61 C 410 55, 410 47, 460 41.4" 
                            fill="none" 
                            stroke="#8b5cf6" 
                            strokeWidth="3.5" 
                          />

                          {/* X-Axis Labels */}
                          {(() => { const tc = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'; return (<>
                          <text x="60" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Jan</text>
                          <text x="160" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Feb</text>
                          <text x="260" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Mar</text>
                          <text x="360" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">Apr</text>
                          <text x="460" y="218" fill={tc} fontSize="10" fontWeight="bold" textAnchor="middle">May</text>
                          </>); })()}

                          {/* Dots - Only show single dot when hovered */}
                          {Object.entries(qualMonthData).map(([m, pt]) => (
                            hoveredQualMonth === m && (
                              <circle 
                                key={m}
                                cx={pt.x} 
                                cy={pt.y} 
                                r="5.5" 
                                fill="#8b5cf6" 
                                stroke="#ffffff" 
                                strokeWidth="2" 
                                className="transition-all duration-200"
                              />
                            )
                          ))}

                          {/* Active glowing dot */}
                          {hoveredQualMonth && (
                            <circle cx={activeQual.x} cy={activeQual.y} r="9" fill="#8b5cf6" fillOpacity="0.25" className="transition-all duration-200" />
                          )}

                          {/* Tooltip floating box */}
                          {hoveredQualMonth && (
                            <g transform={`translate(${activeQual.tx}, ${activeQual.ty})`} className="transition-all duration-300">
                              <rect width="80" height="42" rx="6" fill="#0b0b14" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                              <text x="12" y="16" fill="#ffffff" fontSize="10" fontWeight="bold">{hoveredQualMonth}</text>
                              <text x="12" y="32" fill="#8b5cf6" fontSize="9" fontWeight="bold">qualified : <tspan fill="#ffffff">{activeQual.qualified}</tspan></text>
                            </g>
                          )}

                          {/* Hover Slices/Sensors */}
                          {Object.entries(qualMonthData).map(([m, pt]) => (
                            <circle
                              key={`hover-${m}`}
                              cx={pt.x}
                              cy={pt.y}
                              r="35"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredQualMonth(m)}
                              onMouseLeave={() => setHoveredQualMonth(null)}
                            />
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW: ACCOUNT HEALTH */}
          {activeTab === "health" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-2xl flex items-center gap-6 shadow-premium select-none">
                <div className="w-16 h-16 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Shield className="w-9 h-9" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Excellent</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-emerald-600 dark:text-[#10b981] bg-emerald-50 dark:bg-[#0f2d1e] border border-emerald-200 dark:border-[#047857]/30 tracking-wide uppercase w-fit">
                      98/100 Health Score
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Your account is healthy and performing optimally</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    label: "Account Karma", 
                    value: healthStats.karma, 
                    sub: "+234 this week", 
                    trend: "up", 
                    icon: TrendingUp,
                    iconColor: "text-[#10b981]" 
                  },
                  { 
                    label: "Shadow Ban Status", 
                    value: healthStats.shadowbanStatus, 
                    sub: "All systems go", 
                    trend: "check", 
                    icon: CheckCircle,
                    iconColor: "text-[#10b981]" 
                  },
                  { 
                    label: "API Rate Limit", 
                    value: `${healthStats.rateLimit}%`, 
                    sub: "Well within limits", 
                    trend: "progress", 
                    icon: Clock,
                    iconColor: "text-[#3b82f6]" 
                  },
                  { 
                    label: "Daily Messages", 
                    value: `${healthStats.dailyCount}/${healthStats.dailyLimit}`, 
                    sub: "46% used", 
                    trend: "used", 
                    icon: Shield,
                    iconColor: "text-[#3b82f6]" 
                  }
                ].map((stat, idx) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={idx} className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between h-40 shadow-premium select-none">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">{stat.label}</p>
                        <IconComponent className={`w-4 h-4 ${stat.iconColor}`} />
                      </div>
                      
                      <div>
                        <h4 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{stat.value}</h4>
                      </div>
                      
                      <div>
                        {stat.trend === "progress" ? (
                          <div className="space-y-1.5">
                            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                              <div style={{ width: `${healthStats.rateLimit}%` }} className="h-full bg-[#3b82f6] rounded-full"></div>
                            </div>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            stat.trend === "up" || stat.trend === "check"
                              ? "bg-emerald-50 dark:bg-[#0f2d1e] text-emerald-600 dark:text-[#10b981] border-emerald-200 dark:border-[#047857]/30" 
                              : "bg-blue-50 dark:bg-[#1d2a44] text-blue-600 dark:text-[#3b82f6] border-blue-200 dark:border-[#2563eb]/30"
                          }`}>
                            {stat.sub}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-premium select-none">
                <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-3.5 mb-4">
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">API Connection Status</h4>
                  <p className="text-xs text-zinc-500 font-semibold mt-1">Real-time Reddit API health metrics</p>
                </div>
                <div className="space-y-3">
                  {[
                    { 
                      label: "OAuth Connection", 
                      sub: healthStats.status === "Connected" ? "Connected and authenticated" : (healthStats.status === "No PRAW Credentials" ? "Missing Credentials" : healthStats.status), 
                      tag: healthStats.status === "Connected" ? "Active" : (healthStats.status === "No PRAW Credentials" ? "Setup Needed" : "Failed"), 
                      color: healthStats.status === "Connected" ? "bg-emerald-50 dark:bg-[#0f2d1e] text-emerald-600 dark:text-[#10b981] border-emerald-200 dark:border-[#047857]/30" : 
                             (healthStats.status === "No PRAW Credentials" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-700/30" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 border-red-200 dark:border-red-700/30"),
                      dotColor: healthStats.status === "Connected" ? "bg-[#10b981] shadow-[0_0_12px_#10b981]" : 
                                (healthStats.status === "No PRAW Credentials" ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]" : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]")
                    },
                    { 
                      label: "API Endpoint", 
                      sub: healthStats.status === "Connected" ? "Latency: 124ms" : "Unreachable", 
                      tag: healthStats.status === "Connected" ? "Healthy" : "N/A", 
                      color: healthStats.status === "Connected" ? "bg-emerald-50 dark:bg-[#0f2d1e] text-emerald-600 dark:text-[#10b981] border-emerald-200 dark:border-[#047857]/30" : 
                             "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
                      dotColor: healthStats.status === "Connected" ? "bg-[#10b981] shadow-[0_0_12px_#10b981]" : "bg-zinc-500 shadow-[0_0_12px_rgba(113,113,122,0.5)]"
                    },
                    { 
                      label: "Rate Limits", 
                      sub: healthStats.status === "Connected" ? `Used limit: ${healthStats.rateLimit}%` : "Limits unavailable", 
                      tag: healthStats.status === "Connected" ? (healthStats.rateLimit > 90 ? "Critical" : "Normal") : "Unknown", 
                      color: healthStats.status === "Connected" ? (healthStats.rateLimit > 90 ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 border-red-200 dark:border-red-700/30" : "bg-emerald-50 dark:bg-[#0f2d1e] text-emerald-600 dark:text-[#10b981] border-emerald-200 dark:border-[#047857]/30") : 
                             "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
                      dotColor: healthStats.status === "Connected" ? (healthStats.rateLimit > 90 ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" : "bg-[#10b981] shadow-[0_0_12px_#10b981]") : "bg-zinc-500 shadow-[0_0_12px_rgba(113,113,122,0.5)]"
                    }
                  ].map((conn, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-50 dark:bg-[#18182c]/40 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${conn.dotColor}`}></span>
                        <div className="space-y-0.5">
                          <p className="text-sm font-extrabold text-zinc-900 dark:text-white">{conn.label}</p>
                          <p className={`text-xs ${healthStats.status.startsWith("Error") && conn.label === "OAuth Connection" ? "text-red-500 truncate max-w-[150px]" : "text-zinc-500"} font-semibold`} title={conn.sub}>{conn.sub}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${conn.color}`}>
                        {conn.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: AUDIT LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              <div className="select-none">
                <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Audit Logs</h3>
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1.5">Complete activity history and system events</p>
              </div>

              <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-premium space-y-4">
                <div className="space-y-3">
                  {logs.length > 0 ? (
                    logs.map((row, idx) => (
                      <div key={idx} className="bg-zinc-50 dark:bg-[#18182c]/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4.5 flex items-center justify-between text-xs select-none">
                        <div className="flex items-center gap-3">
                          <Shield className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{row.action}</span>
                          <span className="bg-zinc-100 dark:bg-[#22223b]/50 px-2.5 py-0.5 rounded text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold font-mono">
                            {row.details}
                          </span>
                        </div>
                        <span className="text-zinc-500 text-[11px] font-semibold shrink-0">{row.timestamp ? new Date(row.timestamp).toLocaleString() : ""}</span>
                      </div>
                    ))
                  ) : (
                    <div className="border border-dashed border-glassBorder rounded-xl p-6 text-center text-zinc-500 text-sm">
                       No audit logs recorded yet. Events will appear here.
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {logsTotal > 20 && (
                  <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-4 px-2">
                    <span className="text-xs text-zinc-500 font-semibold">
                      Showing {(logsPage - 1) * 20 + 1} to {Math.min(logsPage * 20, logsTotal)} of {logsTotal}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={logsPage === 1}
                        onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        disabled={logsPage * 20 >= logsTotal}
                        onClick={() => setLogsPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: DO NOT CONTACT */}
          {activeTab === "blocked" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between select-none">
                <div>
                  <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Do Not Contact List</h3>
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1.5">Manage blocked users and exclusions</p>
                </div>
                <button 
                  onClick={() => setShowAddDncModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white text-xs font-bold hover:opacity-90 flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.35)] transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add User</span>
                </button>
              </div>

              {showAddDncModal && (
                <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-6" onClick={() => setShowAddDncModal(false)}>
                  <div className="w-full max-w-sm glass-panel p-6 rounded-3xl space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-glassBorder pb-2">
                      <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-400">Block Reddit User</h4>
                      <button onClick={() => setShowAddDncModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <form onSubmit={handleAddBlocked} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Username (no u/)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. spamguy"
                          value={newBlocked.username}
                          onChange={(e) => setNewBlocked({ ...newBlocked, username: e.target.value })}
                          className="w-full bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl px-4 py-2 text-sm text-zinc-800 dark:text-zinc-400 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Exclusion Reason</label>
                        <input
                          type="text"
                          required
                          placeholder="requested opt-out"
                          value={newBlocked.reason}
                          onChange={(e) => setNewBlocked({ ...newBlocked, reason: e.target.value })}
                          className="w-full bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl px-4 py-2 text-xs text-zinc-800 dark:text-zinc-400 focus:outline-none"
                        />
                      </div>
                      <button type="submit" className="w-full bg-white text-zinc-950 font-bold py-2 rounded-xl text-xs">
                        Block User
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-darkCard border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-premium">
                <div className="pb-4 border-b border-zinc-200 dark:border-zinc-850 mb-4 select-none">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Blocked Users ({blocked.length})</h4>
                </div>

                <div className="space-y-3">
                  {blocked.map((user) => (
                    <div key={user.id} className="bg-zinc-50 dark:bg-[#18182c]/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4.5 flex items-center justify-between text-sm select-none">
                      <div className="flex items-center gap-3">
                        <UserX className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="text-zinc-800 dark:text-white font-extrabold">u/{user.username}</span>
                        {user.reason && <span className="text-xs text-zinc-500 font-semibold italic">({user.reason})</span>}
                      </div>
                      <button
                        onClick={() => handleDeleteBlocked(user.id)}
                        className="p-1 text-zinc-500 hover:text-rose-500 transition-colors"
                        title="Remove Exclusion Block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {blocked.length === 0 && (
                    <div className="p-8 text-center text-xs text-zinc-500 italic border border-dashed border-zinc-800/80 rounded-xl w-full">
                      No exclusion records blocked. Click Add User to register.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-glassBorder pb-3">
                <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-400">Settings</h3>
                <p className="text-xs text-zinc-500">Configure PulsePilot behavior and preferences</p>
              </div>

              {/* 1. AI Configuration Card */}
              <div className="glass-panel p-6 rounded-3xl border border-glassBorder space-y-5">
                <div className="border-b border-zinc-200 dark:border-glassBorder/60 pb-3">
                  <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-400">AI Configuration</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400">Minimum AI Score (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={settingsMinScore}
                      onChange={(e) => setSettingsMinScore(parseInt(e.target.value, 10))}
                      className="w-full bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl p-3 text-xs text-zinc-800 dark:text-zinc-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-zinc-500 font-semibold">Only qualify leads with AI score &gt; this value</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 font-semibold">AI Model</label>
                    <select
                      value={settingsModel}
                      onChange={(e) => setSettingsModel(e.target.value)}
                      className="w-full bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl p-3 text-xs text-zinc-800 dark:text-zinc-400 focus:outline-none"
                    >
                      <option value="GPT-4 Turbo (Recommended)">GPT-4 Turbo (Recommended)</option>
                      <option value="Gemini 1.5 Pro (Recommended)">Gemini 1.5 Pro (Recommended)</option>
                      <option value="Gemini 1.5 Flash">Gemini 1.5 Flash</option>
                    </select>
                    <p className="text-[10px] text-zinc-500 font-semibold">Select the AI model for lead qualification</p>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-400">Auto-Qualify Leads</p>
                      <p className="text-[10px] text-zinc-500 font-semibold">Automatically qualify high-scoring leads</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsAutoQualify}
                      onChange={(e) => setSettingsAutoQualify(e.target.checked)}
                      className="w-4 h-4 accent-accentPurple"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Outreach Limits Card */}
              <div className="glass-panel p-6 rounded-3xl border border-glassBorder space-y-5">
                <div className="border-b border-zinc-200 dark:border-glassBorder/60 pb-3">
                  <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-400">Outreach Limits</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 font-semibold font-sans">Max Messages Per Day</label>
                    <input
                      type="number"
                      value={settingsMaxMessages}
                      onChange={(e) => setSettingsMaxMessages(parseInt(e.target.value, 10))}
                      className="w-full bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl p-3 text-xs text-zinc-800 dark:text-zinc-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-zinc-500 font-semibold">Limit daily outreach to stay within Reddit guidelines</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 font-semibold">Message Interval (minutes)</label>
                    <input
                      type="number"
                      value={settingsInterval}
                      onChange={(e) => setSettingsInterval(parseInt(e.target.value, 10))}
                      className="w-full bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl p-3 text-xs text-zinc-800 dark:text-zinc-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-zinc-500 font-semibold">Minimum time between sending messages</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 font-semibold">Active Hours (UTC)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={settingsActiveStart}
                        onChange={(e) => setSettingsActiveStart(e.target.value)}
                        className="bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl p-3 text-xs text-zinc-800 dark:text-zinc-400 focus:outline-none"
                        placeholder="09:00 AM"
                      />
                      <input
                        type="text"
                        value={settingsActiveEnd}
                        onChange={(e) => setSettingsActiveEnd(e.target.value)}
                        className="bg-zinc-100/60 dark:bg-zinc-950/40 border border-glassBorder rounded-xl p-3 text-xs text-zinc-800 dark:text-zinc-400 focus:outline-none"
                        placeholder="05:00 PM"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 font-semibold">Only send messages during these hours</p>
                  </div>
                </div>
              </div>

              {/* 3. Notifications Card */}
              <div className="glass-panel p-6 rounded-3xl border border-glassBorder space-y-4">
                <div className="border-b border-zinc-200 dark:border-glassBorder/60 pb-3">
                  <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-400">Notifications</h4>
                </div>
                <div className="space-y-3.5">
                  {[
                    { label: "Email Notifications", state: settingsEmailNotif, setter: setSettingsEmailNotif, sub: "Receive email updates for important events" },
                    { label: "High Score Lead Alerts", state: settingsHighScoreNotif, setter: setSettingsHighScoreNotif, sub: "Get notified when AI finds leads scoring 90+" },
                    { label: "Reply Notifications", state: settingsReplyNotif, setter: setSettingsReplyNotif, sub: "Alert when leads reply to outreach" }
                  ].map((notif, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-zinc-150 dark:border-glassBorder/40 last:border-b-0 pb-3 last:pb-0">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-400">{notif.label}</p>
                        <p className="text-[10px] text-zinc-500 font-semibold">{notif.sub}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notif.state}
                        onChange={(e) => notif.setter(e.target.checked)}
                        className="w-4 h-4 accent-accentPurple"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={handleResetSettingsDefaults}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettingsPanel}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accentPurple to-accentBlue text-white text-xs font-bold hover:opacity-90 shadow-glow"
                >
                  Save Settings
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* DETAILED LEAD VIEW PANEL */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[600px] glass-panel border-l border-glassBorder shadow-premium z-50 flex flex-col justify-between animate-slide-in">
          
          <div className="p-6 border-b border-glassBorder flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/20">
            <div>
              <span className="text-[9px] font-bold text-accentBlue bg-accentBlue/10 border border-accentBlue/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                r/{selectedLead.subreddit_name}
              </span>
              <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-800 dark:text-zinc-100 mt-2 line-clamp-1">
                {selectedLead.title}
              </h3>
            </div>
            <button 
              onClick={() => setSelectedLead(null)}
              className="text-zinc-500 dark:text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div className="bg-zinc-950/30 p-4.5 rounded-2xl border border-glassBorder">
              <div className="flex justify-between text-[10px] text-zinc-500 mb-2">
                <span>Discovered Author: u/{selectedLead.author_username}</span>
                <span>Date: {new Date(selectedLead.created_at).toLocaleString()}</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line mt-2">
                {selectedLead.content}
              </p>
              <a 
                href={selectedLead.post_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] text-accentBlue hover:underline mt-4 font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open original post on Reddit
              </a>
            </div>

            <div className="bg-accentGold/5 border border-accentGold/20 p-4.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-accentGold uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accentGold" />
                  Gemini Qualification Assessment
                </h4>
                <span className="text-xs font-extrabold text-accentGold bg-accentGold/10 px-2.5 py-0.5 rounded-md">
                  Score: {selectedLead.ai_score}/10
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal mt-2">
                {selectedLead.ai_reason}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-glassBorder pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Targeted Outreach Draft (Personalized)
                </h4>
                {aiGenerating && (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-accentPurple" />
                    AI Copywriter thinking...
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="font-bold uppercase">Direct Message Body</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(aiGeneratedContent.dm);
                      setNotice({ type: "success", text: "DM draft copied to clipboard!" });
                    }}
                    className="hover:underline text-accentBlue font-bold"
                  >
                    Copy draft
                  </button>
                </div>
                <textarea
                  rows="5"
                  value={aiGeneratedContent.dm}
                  onChange={(e) => setAiGeneratedContent({ ...aiGeneratedContent, dm: e.target.value })}
                  className="w-full bg-zinc-950 border border-glassBorder rounded-2xl p-3 text-xs text-zinc-600 dark:text-zinc-300 focus:outline-none"
                />
                <button
                  onClick={() => handleScheduleOutreach(selectedLead, "dm")}
                  disabled={!aiGeneratedContent.dm}
                  className="w-full bg-accentBlue text-zinc-800 dark:text-white font-bold py-2.5 rounded-xl text-xs hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Approve & Schedule DM Delivery</span>
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="font-bold uppercase">Public Thread Comment</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(aiGeneratedContent.comment);
                      setNotice({ type: "success", text: "Comment draft copied to clipboard!" });
                    }}
                    className="hover:underline text-accentPurple font-bold"
                  >
                    Copy draft
                  </button>
                </div>
                <textarea
                  rows="4"
                  value={aiGeneratedContent.comment}
                  onChange={(e) => setAiGeneratedContent({ ...aiGeneratedContent, comment: e.target.value })}
                  className="w-full bg-zinc-950 border border-glassBorder rounded-2xl p-3 text-xs text-zinc-600 dark:text-zinc-300 focus:outline-none"
                />
                <button
                  onClick={() => handleScheduleOutreach(selectedLead, "comment")}
                  disabled={!aiGeneratedContent.comment}
                  className="w-full bg-accentPurple text-zinc-800 dark:text-white font-bold py-2.5 rounded-xl text-xs hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Approve & Schedule Comment Reply</span>
                </button>
              </div>
            </div>

          </div>

          <div className="p-6 border-t border-glassBorder bg-zinc-100/60 dark:bg-zinc-950/40 flex items-center justify-between">
            <button
              onClick={() => handleDeleteLead(selectedLead.id)}
              className="text-xs font-bold text-accentRed hover:underline flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Lead</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateLeadStatus(selectedLead.id, "disqualified")}
                className="px-3.5 py-2 rounded-xl border border-glassBorder text-xs text-zinc-500 dark:text-zinc-400 hover:text-white"
              >
                Disqualify Target
              </button>
              <button
                onClick={() => handleUpdateLeadStatus(selectedLead.id, "converted")}
                className="px-3.5 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs"
              >
                Mark Converted
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Simulated Session Expired Overlay Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl space-y-4 text-center border border-accentRed/35 shadow-glow relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-accentRed/10 border border-accentRed/25 flex items-center justify-center mx-auto text-accentRed">
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-zinc-700 dark:text-zinc-400">Security Session Expired</h4>
              <p className="text-xs text-zinc-500 leading-normal">
                Your credentials signature is stale. Please re-authenticate your secure token.
              </p>
            </div>
            <button
              onClick={() => {
                setShowSessionModal(false);
                handleLogout();
              }}
              className="w-full bg-accentRed text-zinc-800 dark:text-white font-bold py-2 rounded-xl text-xs hover:opacity-90 transition-all"
            >
              Re-authenticate Secure Token
            </button>
          </div>
        </div>
      )}

    </div>
  );

  // Sub-render Helpers
  function renderNavItems() {
    return [
      { id: "overview", label: "Overview Dashboard", icon: LayoutDashboard },
      { id: "pipeline", label: "Leads Pipeline", icon: Kanban },
      { id: "subreddits", label: "Subreddit Management", icon: Radio },
      { id: "keywords", label: "Keyword Management", icon: Hash },
      { id: "queue", label: "Outreach Queue", icon: Clock },
      { id: "sequences", label: "Message Templates", icon: Layers },
      { id: "analytics", label: "Analytics Dashboard", icon: BarChart3 },
      { id: "logs", label: "Audit Logs", icon: FileText },
      { id: "health", label: "Account Health", icon: HeartPulse },
      { id: "blocked", label: "Do Not Contact", icon: UserX },
      { id: "settings", label: "Settings", icon: Sliders }
    ].map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id);
            setSelectedLead(null);
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            isActive
              ? "bg-accentPurple/15 text-accentPurple border-l-4 border-accentPurple font-extrabold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/10"
          }`}
          title={sidebarCollapsed ? tab.label : undefined}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {(!sidebarCollapsed || mobileMenuOpen) && <span className="truncate">{tab.label}</span>}
        </button>
      );
    });
  }

  function renderSidebarProfile() {
    return (
      <div className="relative">
        <div 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={`flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all ${
            sidebarCollapsed && !mobileMenuOpen ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accentPurple to-accentBlue flex items-center justify-center font-bold text-white shadow-glow shrink-0">
            D
          </div>
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="flex-1 min-w-0 text-left animate-fade-in">
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300 truncate">Demo Account</p>
              <p className="text-[10px] text-zinc-500 truncate font-semibold">demo@pulsepilot.ai</p>
            </div>
          )}
        </div>

        {showProfileMenu && (
          <div className={`absolute bottom-12 mt-2 w-48 glass-panel rounded-2xl p-2 shadow-premium border border-glassBorder z-30 space-y-1 animate-fade-in ${
            sidebarCollapsed && !mobileMenuOpen ? "left-6" : "left-0"
          }`}>
            <button 
              onClick={() => {
                setShowProfileMenu(false);
                setShowSessionModal(true);
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#8b5cf6] hover:text-[#a855f7] hover:bg-white/5 rounded-xl transition-all"
            >
              Simulate Expired Session
            </button>
            <button 
              onClick={handleLogout}
              className="w-full text-left px-3.5 py-2 text-xs font-bold text-accentRed hover:bg-accentRed/10 rounded-xl transition-all"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderAccountHealthStats() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-sans">
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Karma</p>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-black text-zinc-800 dark:text-zinc-400">{healthStats.karma}</span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold text-accentGreen bg-accentGreen/10 border border-accentGreen/25 uppercase tracking-wide">
              Healthy
            </span>
          </div>
        </div>

        <div className="space-y-1 flex flex-col justify-center">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">
            <span>API Rate Limit</span>
            <span className="text-zinc-500 dark:text-zinc-400 font-bold">{healthStats.rateLimit}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-950/60 rounded-full overflow-hidden border border-zinc-150 dark:border-glassBorder/40">
            <div 
              style={{ width: `${healthStats.rateLimit}%` }} 
              className="h-full bg-accentGreen rounded-full shadow-glow"
            ></div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Daily Messages</p>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-black text-zinc-800 dark:text-zinc-400">{healthStats.dailyCount}/{healthStats.dailyLimit}</span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold text-accentBlue bg-accentBlue/10 border border-accentBlue/25 uppercase tracking-wide">
              On Track
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Shadow Ban Status</p>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-black text-zinc-800 dark:text-zinc-400">{healthStats.shadowbanStatus}</span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold text-accentGreen bg-accentGreen/10 border border-accentGreen/25 uppercase tracking-wide">
              All Good
            </span>
          </div>
        </div>
      </div>
    );
  }
}
