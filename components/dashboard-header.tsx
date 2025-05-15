"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Bell,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Info,
  HelpCircle,
  Check,
  UserPlus,
  Lock,
  Globe,
  Users,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import ThemeToggle from "./theme-toggle"

type Notification = {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning"
  date: string
  read: boolean
}

type TeamMember = {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member"
  avatar?: string
}

type Project = {
  id: number
  name: string
  description: string | null
  visibility: "private" | "team" | "public"
  members: string[]
}

export default function DashboardHeader() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Nueva versión disponible",
      message: "Se ha lanzado la versión 2.0 con nuevas características.",
      type: "info",
      date: "2023-05-10T14:30:00",
      read: false,
    },
    {
      id: "2",
      title: "Nuevo lenguaje soportado",
      message: "Ahora puedes generar backends en Ruby.",
      type: "success",
      date: "2023-05-09T10:15:00",
      read: false,
    },
    {
      id: "3",
      title: "Mantenimiento programado",
      message: "El sistema estará en mantenimiento el próximo domingo.",
      type: "warning",
      date: "2023-05-07T09:00:00",
      read: false,
    },
    {
      id: "4",
      title: "Actualización de seguridad",
      message: "Hemos actualizado nuestros protocolos de seguridad.",
      type: "info",
      date: "2023-05-05T16:45:00",
      read: true,
    },
    {
      id: "5",
      title: "Nueva integración disponible",
      message: "Ahora puedes conectar tu backend con Firebase.",
      type: "success",
      date: "2023-05-03T11:20:00",
      read: true,
    },
  ])

  // Corregir los estados de los modales que estaban invertidos
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Estado para la pestaña activa en configuración
  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "team" | "security">("general")

  // Datos de ejemplo para el equipo
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "Jean Correa",
      email: "jeancorrea@gmail.com",
      role: "owner",
    },
    {
      id: "2",
      name: "Ana Martínez",
      email: "ana.martinez@example.com",
      role: "admin",
    },
    {
      id: "3",
      name: "Carlos López",
      email: "carlos.lopez@example.com",
      role: "member",
    },
  ])

  // Datos de ejemplo para proyectos
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: "API REST Node.js",
      description: "Backend para aplicación móvil",
      visibility: "team",
      members: ["1", "2"],
    },
    {
      id: 2,
      name: "Microservicio Python",
      description: "Servicio de procesamiento de datos",
      visibility: "private",
      members: ["1"],
    },
    {
      id: 3,
      name: "API GraphQL",
      description: "Backend para dashboard administrativo",
      visibility: "public",
      members: ["1", "2", "3"],
    },
  ])

  // Referencias para detectar clics fuera de los modales
  const profileModalRef = useRef<HTMLDivElement>(null)
  const settingsModalRef = useRef<HTMLDivElement>(null)
  const helpModalRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Efecto para cerrar modales al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Cerrar modales si se hace clic fuera
      if (profileModalRef.current && !profileModalRef.current.contains(event.target as Node)) {
        setShowProfileModal(false)
      }
      if (settingsModalRef.current && !settingsModalRef.current.contains(event.target as Node)) {
        setShowSettingsModal(false)
      }
      if (helpModalRef.current && !helpModalRef.current.contains(event.target as Node)) {
        setShowHelpModal(false)
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node) &&
        !showAllNotifications
      ) {
        setIsNotificationsOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showAllNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Hoy"
    } else if (diffDays === 1) {
      return "Ayer"
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`
    } else {
      return date.toLocaleDateString()
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(notifications.filter((notification) => notification.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      case "success":
        return <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
      case "warning":
        return <Info className="h-4 w-4 text-orange-500 dark:text-orange-400" />
      default:
        return <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-100 dark:bg-blue-900"
      case "success":
        return "bg-green-100 dark:bg-green-900"
      case "warning":
        return "bg-orange-100 dark:bg-orange-900"
      default:
        return "bg-gray-100 dark:bg-gray-900"
    }
  }

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    // Eliminar cookie de autenticación
    document.cookie = "fake_auth=; path=/; max-age=0; SameSite=Strict"
    // Redirigir al login
    router.push("/login")
  }

  // Función para añadir miembro al equipo
  const addTeamMember = (email: string, role: "admin" | "member") => {
    const newMember: TeamMember = {
      id: `${teamMembers.length + 1}`,
      name: email.split("@")[0],
      email,
      role,
    }
    setTeamMembers([...teamMembers, newMember])
  }

  // Función para cambiar la visibilidad de un proyecto
  const changeProjectVisibility = (projectId: number, visibility: "private" | "team" | "public") => {
    setProjects(projects.map((project) => (project.id === projectId ? { ...project, visibility } : project)))
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div
              className="flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
                <div className="h-2 w-2 bg-orange-300 rounded-full"></div>
              </div>
              <span className="ml-2 font-bold text-lg">BackendIO</span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-2">
              <div className="bg-orange-500 text-white rounded-full h-8 w-8 flex items-center justify-center">
                <span className="text-xs font-medium">JS</span>
              </div>
              <div className="bg-orange-400 text-white rounded-full h-8 w-8 flex items-center justify-center">
                <span className="text-xs font-medium">PY</span>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full h-8 w-8 flex items-center justify-center">
                <span className="text-xs font-medium">+</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar tecnologías, módulos..."
                className="w-full py-2 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-orange-500 focus:outline-none transition dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Botón de notificaciones */}
            <div className="relative">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen)
                  setShowAllNotifications(false)
                }}
              >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Modal de notificaciones */}
              <AnimatePresence>
                {isNotificationsOpen && !showAllNotifications && (
                  <motion.div
                    ref={notificationsRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-medium">Notificaciones</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} sin leer</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications
                        .filter((n) => !n.read)
                        .slice(0, 3)
                        .map((notification) => (
                          <div
                            key={notification.id}
                            className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer relative"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start">
                              <div className={`${getNotificationColor(notification.type)} p-2 rounded-full mr-3`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{notification.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                  {formatDate(notification.date)}
                                </p>
                              </div>
                              <button
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                onClick={(e) => removeNotification(notification.id, e)}
                                title="Eliminar notificación"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                      {notifications.filter((n) => !n.read).length === 0 && (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No tienes notificaciones sin leer
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
                      <button
                        className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                        onClick={() => setShowAllNotifications(true)}
                      >
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Vista de todas las notificaciones */}
                {isNotificationsOpen && showAllNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold">Todas las Notificaciones</h2>
                        <button
                          onClick={() => {
                            setShowAllNotifications(false)
                            setIsNotificationsOpen(false)
                          }}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Cerrar"
                        >
                          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>

                      <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button className="px-4 py-2 font-medium text-sm border-b-2 border-orange-500 text-orange-600">
                          Todas
                        </button>
                        <button className="px-4 py-2 font-medium text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                          No leídas ({unreadCount})
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-2">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 mb-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer relative ${
                              notification.read ? "opacity-75" : ""
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start">
                              <div className={`${getNotificationColor(notification.type)} p-2 rounded-full mr-3`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium">{notification.title}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatDate(notification.date)}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                                {!notification.read && (
                                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 mt-2">
                                    Nueva
                                  </span>
                                )}
                              </div>
                              <button
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                onClick={(e) => removeNotification(notification.id, e)}
                                title="Eliminar notificación"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {notifications.length === 0 && (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No tienes notificaciones
                          </div>
                        )}
                      </div>

                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                          onClick={() => {
                            setShowAllNotifications(false)
                            setIsNotificationsOpen(false)
                          }}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* Menú de usuario */}
            <div className="hidden md:block relative">
              <button
                className="bg-gray-800 dark:bg-gray-600 text-white rounded-full h-8 w-8 flex items-center justify-center"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <span className="text-xs font-medium">JC</span>
              </button>

              {/* Menú desplegable de usuario */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    ref={userMenuRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium">Jean Correa</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">demo@backendio.com</p>
                    </div>
                    <div>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setShowProfileModal(true)
                        }}
                      >
                        <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm">Mi Perfil</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setShowSettingsModal(true)
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm">Configuración</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setShowHelpModal(true)
                        }}
                      >
                        <HelpCircle className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm">Ayuda</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center border-t border-gray-200 dark:border-gray-700"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm">Cerrar Sesión</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isMenuOpen ? "max-h-96 mt-3" : "max-h-0",
          )}
        >
          <div className="py-3 space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar tecnologías, módulos..."
                className="w-full py-2 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-orange-500 focus:outline-none transition dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-orange-500 text-white rounded-full h-8 w-8 flex items-center justify-center">
                <span className="text-xs font-medium">JS</span>
              </div>
              <div className="bg-orange-400 text-white rounded-full h-8 w-8 flex items-center justify-center">
                <span className="text-xs font-medium">PY</span>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full h-8 w-8 flex items-center justify-center">
                <span className="text-xs font-medium">+</span>
              </div>
            </div>

            {/* Opciones de usuario en móvil */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="flex items-center p-2">
                <div className="bg-gray-800 dark:bg-gray-600 text-white rounded-full h-8 w-8 flex items-center justify-center mr-3">
                  <span className="text-xs font-medium">JC</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Jean Correa</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">demo@backendio.com</p>
                </div>
              </div>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => {
                  setIsMenuOpen(false)
                  setShowProfileModal(true)
                }}
              >
                <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm">Mi Perfil</span>
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => {
                  setIsMenuOpen(false)
                  setShowSettingsModal(true)
                }}
              >
                <Settings className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm">Configuración</span>
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => {
                  setIsMenuOpen(false)
                  setShowHelpModal(true)
                }}
              >
                <HelpCircle className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm">Ayuda</span>
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Perfil */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <div ref={profileModalRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Mi Perfil</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gray-800 dark:bg-gray-600 text-white rounded-full h-20 w-20 flex items-center justify-center">
                    <span className="text-xl font-medium">JC</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      type="text"
                      defaultValue="Jean Correa"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      defaultValue="demo@backendio.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña</label>
                    <input
                      type="password"
                      defaultValue="••••••••"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button className="text-xs text-orange-500 hover:text-orange-600 mt-1">Cambiar contraseña</button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Zona Horaria</label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white">
                      <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                      <option>(GMT-06:00) Central Time (US & Canada)</option>
                      <option>(GMT-07:00) Mountain Time (US & Canada)</option>
                      <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Configuración */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <div
              ref={settingsModalRef}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Configuración</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  className={cn(
                    "px-4 py-2 font-medium text-sm",
                    activeSettingsTab === "general"
                      ? "border-b-2 border-orange-500 text-orange-600"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
                  )}
                  onClick={() => setActiveSettingsTab("general")}
                >
                  General
                </button>
                <button
                  className={cn(
                    "px-4 py-2 font-medium text-sm",
                    activeSettingsTab === "team"
                      ? "border-b-2 border-orange-500 text-orange-600"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
                  )}
                  onClick={() => setActiveSettingsTab("team")}
                >
                  Equipo
                </button>
                <button
                  className={cn(
                    "px-4 py-2 font-medium text-sm",
                    activeSettingsTab === "security"
                      ? "border-b-2 border-orange-500 text-orange-600"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
                  )}
                  onClick={() => setActiveSettingsTab("security")}
                >
                  Seguridad
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* Pestaña General */}
                {activeSettingsTab === "general" && (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Plan Actual</h3>
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-orange-600 dark:text-orange-400">Plan Free</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              Acceso básico a todas las funcionalidades
                            </p>
                          </div>
                          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Activo
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Hasta 3 proyectos</span>
                          </div>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Generación de código básica</span>
                          </div>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Exportación de proyectos</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            Actualizar a Premium
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Planes Disponibles</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h4 className="font-semibold">Plan Pro</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Para desarrolladores individuales
                          </p>
                          <p className="text-xl font-bold mt-2">
                            $9.99 <span className="text-sm font-normal">/mes</span>
                          </p>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm">Proyectos ilimitados</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm">Generación de código avanzada</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm">Soporte prioritario</span>
                            </div>
                          </div>
                          <button className="w-full mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium">
                            Seleccionar Plan
                          </button>
                        </div>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h4 className="font-semibold">Plan Enterprise</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Para equipos y empresas</p>
                          <p className="text-xl font-bold mt-2">
                            $49.99 <span className="text-sm font-normal">/mes</span>
                          </p>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm">Todo lo del Plan Pro</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm">Colaboración en equipo</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm">Integraciones avanzadas</span>
                            </div>
                          </div>
                          <button className="w-full mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium">
                            Seleccionar Plan
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Preferencias</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Tema</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Elige entre modo claro, oscuro o automático
                            </p>
                          </div>
                          <ThemeToggle />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Notificaciones por correo</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Recibir notificaciones por correo electrónico
                            </p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" name="toggle" id="toggle" className="sr-only" defaultChecked />
                            <label
                              htmlFor="toggle"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"
                            >
                              <span className="block h-6 w-6 rounded-full bg-white dark:bg-gray-600 transform translate-x-0 transition-transform duration-200 ease-in-out"></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Pestaña Equipo */}
                {activeSettingsTab === "team" && (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Miembros del Equipo</h3>
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                  Usuario
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                  Correo
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                  Rol
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                              {teamMembers.map((member) => (
                                <tr key={member.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                        <span className="text-xs font-medium">
                                          {member.name.substring(0, 2).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {member.name}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                      ${
                                        member.role === "owner"
                                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                          : member.role === "admin"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      }`}
                                    >
                                      {member.role === "owner"
                                        ? "Propietario"
                                        : member.role === "admin"
                                          ? "Administrador"
                                          : "Miembro"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {member.role !== "owner" && (
                                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                        Eliminar
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Añadir Miembro</h3>
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="member-email" className="block text-sm font-medium mb-1">
                              Correo Electrónico
                            </label>
                            <input
                              id="member-email"
                              type="email"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                              placeholder="correo@ejemplo.com"
                            />
                          </div>

                          <div>
                            <label htmlFor="member-role" className="block text-sm font-medium mb-1">
                              Rol
                            </label>
                            <select
                              id="member-role"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="admin">Administrador</option>
                              <option value="member">Miembro</option>
                            </select>
                          </div>

                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Añadir Miembro
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Invitaciones Pendientes</h3>
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No hay invitaciones pendientes en este momento.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Pestaña Seguridad */}
                {activeSettingsTab === "security" && (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Proyectos y Permisos</h3>
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                  Proyecto
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                  Visibilidad
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                  Miembros
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                              {projects.map((project) => (
                                <tr key={project.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {project.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {project.description}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {project.visibility === "private" && (
                                        <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                                      )}
                                      {project.visibility === "team" && (
                                        <Users className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-1" />
                                      )}
                                      {project.visibility === "public" && (
                                        <Globe className="h-4 w-4 text-green-500 dark:text-green-400 mr-1" />
                                      )}
                                      <span className="text-sm">
                                        {project.visibility === "private"
                                          ? "Privado"
                                          : project.visibility === "team"
                                            ? "Equipo"
                                            : "Público"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex -space-x-2">
                                      {project.members.map((memberId, index) => (
                                        <div
                                          key={memberId}
                                          className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-2 border-white dark:border-gray-700"
                                          style={{ zIndex: 10 - index }}
                                        >
                                          <span className="text-xs font-medium">
                                            {teamMembers
                                              .find((m) => m.id === memberId)
                                              ?.name.substring(0, 1)
                                              .toUpperCase()}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <select
                                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700"
                                      value={project.visibility}
                                      onChange={(e) => changeProjectVisibility(project.id, e.target.value as any)}
                                    >
                                      <option value="private">Privado</option>
                                      <option value="team">Equipo</option>
                                      <option value="public">Público</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Seguridad de la Cuenta</h3>
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Autenticación de dos factores</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Añade una capa extra de seguridad a tu cuenta
                              </p>
                            </div>
                            <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm">
                              Activar
                            </button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Sesiones activas</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gestiona tus sesiones activas en diferentes dispositivos
                              </p>
                            </div>
                            <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                              Ver sesiones
                            </button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-red-600 dark:text-red-400">Eliminar cuenta</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Esta acción es permanente y no se puede deshacer
                              </p>
                            </div>
                            <button className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg text-sm transition-colors">
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                  onClick={() => setShowSettingsModal(false)}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Ayuda */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <div ref={helpModalRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Ayuda y Soporte</h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-4">
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Centro de Ayuda</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Encuentra respuestas a preguntas frecuentes y tutoriales detallados.
                    </p>
                    <button className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center">
                      <HelpCircle className="h-4 w-4 mr-1" />
                      Visitar Centro de Ayuda
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Soporte Técnico</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      ¿Tienes problemas? Nuestro equipo de soporte está listo para ayudarte.
                    </p>
                    <button className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Contactar Soporte
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Documentación</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Explora nuestra documentación detallada para desarrolladores.
                    </p>
                    <button className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Ver Documentación
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-3">Contáctanos</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    ¿No encuentras lo que buscas? Envíanos un mensaje directamente.
                  </p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white mb-3"
                    rows={4}
                    placeholder="Describe tu problema o pregunta..."
                  ></textarea>
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
                    Enviar Mensaje
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
