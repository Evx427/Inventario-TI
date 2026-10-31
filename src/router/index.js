import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [

  // RUTAS 

{
    path: '/',
    name: 'home',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
},

{
    path: '/equipos',
    name: 'equipos',
    component: () => import('../views/EquiposView.vue'),
    meta: { requiresAuth: true },
},

  
{
    path: '/categorias',
    name: 'categorias',
    component: () => import('../views/CategoriasView.vue'),
    meta: { requiresAuth: true },
},

{
    path: '/reportes',
    name: 'reportes',
    component: () => import('../views/ReportesView.vue'),
    meta: { requiresAuth: true },
},

{
   path: '/control-mac',
   name: 'control-mac',
   component: () => import('../views/ControlMacView.vue'),
   meta: { requiresAuth: true },
},

{
  path: '/consultas',
  name: 'consultas',
  component: () => import('../views/ConsultasView.vue'),
  meta: { requiresAuth:  true },

},

{
    path: '/auditoria',
    name: 'auditoria',
    component: () => import('../views/AuditoriaView.vue'),
    meta: { requiresAuth: true, requiresSuperUsuario: true }, 
},

{
    path: '/solicitudes',
    name: 'solicitudes',
    component: () => import('../views/SolicitudesView.vue'),
    meta: { requiresAuth: true },
},

{
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('../views/UsuariosView.vue'),
    meta: { requiresAuth: true, requiresSuperUsuario: true }, 
 },
  
{
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresGuest: true },
},

{
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPasswordView.vue'),
    meta: { requiresGuest: true },
  },

  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/ResetPasswordView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.user && !auth.loading) {
    await auth.init()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return { name: 'home' }
  }

  // Proteger ruta de Admin Usuarios para que solo entre el SuperUsuario
  if (to.meta.requiresSuperUsuario && !auth.isSuperUsuario) {
    return { name: 'home' }
  }
})

export default router