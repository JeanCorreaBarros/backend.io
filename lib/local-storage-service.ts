// Tipos de datos
export interface User {
  id: number
  username: string
  email: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  user_id: number
  created_at: string
  updated_at: string
}

export interface ProjectConfig {
  id: number
  project_id: number
  backend_type: string
  backend_version: string
  database_type: string | null
  database_connection_string: string | null
  features: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface GeneratedFile {
  id: number
  project_id: number
  file_path: string
  file_content: string
  created_at: string
  updated_at: string
}

// Funciones de utilidad
const getItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  
  try {
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Servicio de usuario
export const userService = {
  getCurrentUser: (): User | null => {
    return getItem<User | null>('currentUser', null);
  },
  
  login: (email: string, password: string): User | null => {
    // Credenciales hardcodeadas
    if (email === 'demo@backendio.com' && password === '123456789') {
      const user: User = {
        id: 1,
        username: 'Jean Correa',
        email: 'demo@backendio.com'
      };
      setItem('currentUser', user);
      return user;
    }
    return null;
  },
  
  logout: (): void => {
    localStorage.removeItem('currentUser');
  }
};

// Servicio de proyectos
export const projectService = {
  getProjects: (): Project[] => {
    return getItem<Project[]>('projects', []);
  },
  
  getProjectById: (id: number): Project | undefined => {
    const projects = getItem<Project[]>('projects', []);
    return projects.find(p => p.id === id);
  },
  
  createProject: (name: string, description: string | null): Project => {
    const projects = getItem<Project[]>('projects', []);
    const now = new Date().toISOString();
    
    // Generar un ID único
    const maxId = projects.reduce((max, p) => Math.max(max, p.id), 0);
    const newId = maxId + 1;
    
    const newProject: Project = {
      id: newId,
      name,
      description,
      user_id: 1, // Usuario simulado
      created_at: now,
      updated_at: now
    };
    
    projects.push(newProject);
    setItem('projects', projects);
    
    return newProject;
  },
  
  updateProject: (id: number, data: Partial<Project>): Project | undefined => {
    const projects = getItem<Project[]>('projects', []);
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return undefined;
    
    const updatedProject = {
      ...projects[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    projects[index] = updatedProject;
    setItem('projects', projects);
    
    return updatedProject;
  },
  
  deleteProject: (id: number): boolean => {
    const projects = getItem<Project[]>('projects', []);
    const filteredProjects = projects.filter(p => p.id !== id);
    
    if (filteredProjects.length === projects.length) return false;
    
    setItem('projects', filteredProjects);
    
    // También eliminar configuraciones y archivos asociados
    configService.deleteConfigByProjectId(id);
    fileService.deleteFilesByProjectId(id);
    
    return true;
  }
};

// Servicio de configuración de proyectos
export const configService = {
  getConfigByProjectId: (projectId: number): ProjectConfig | undefined => {
    const configs = getItem<ProjectConfig[]>('projectConfigs', []);
    return configs.find(c => c.project_id === projectId);
  },
  
  createOrUpdateConfig: (projectId: number, data: Partial<ProjectConfig>): ProjectConfig => {
    let configs: ProjectConfig[] = getItem<ProjectConfig[]>('projectConfigs', []);
    const now = new Date().toISOString();
    let existingIndex = configs.findIndex(c => c.project_id === projectId);
    
    if (existingIndex !== -1) {
      // Actualizar configuración existente
      const updatedConfig = {
        ...configs[existingIndex],
        ...data,
        updated_at: now
      };
      
      configs[existingIndex] = updatedConfig;
      setItem('projectConfigs', configs);
      
      return updatedConfig;
    } else {
      // Crear nueva configuración
      const maxId = configs.reduce((max, c) => Math.max(max, c.id), 0);
      const newId = maxId + 1;
      
      const newConfig: ProjectConfig = {
        id: newId,
        project_id: projectId,
        backend_type: data.backend_type || 'node',
        backend_version: data.backend_version || 'v18.x',
        database_type: data.database_type || 'mongodb',
        database_connection_string: data.database_connection_string || 'mongodb://localhost:27017/myapp',
        features: data.features || {
          jwt: true,
          crud: true,
          swagger: false,
          tests: false
        },
        created_at: now,
        updated_at: now
      };
      
      configs.push(newConfig);
      setItem('projectConfigs', configs);
      
      return newConfig;
    }
  },
  
  deleteConfigByProjectId: (projectId: number): boolean => {
    const configs = getItem<ProjectConfig[]>('projectConfigs', []);
    const filteredConfigs = configs.filter(c => c.project_id !== projectId);
    
    if (filteredConfigs.length === configs.length) return false;
    
    setItem('projectConfigs', filteredConfigs);
    return true;
  }
};

// Servicio de archivos generados
export const fileService = {
  getFilesByProjectId: (projectId: number): GeneratedFile[] => {
    const files = getItem<GeneratedFile[]>('generatedFiles', []);
    return files.filter(f => f.project_id === projectId);
  },
  
  getFileByPath: (projectId: number, filePath: string): GeneratedFile | undefined => {
    const files = getItem<GeneratedFile[]>('generatedFiles', []);
    return files.find(f => f.project_id === projectId && f.file_path === filePath);
  },
  
  createFile: (projectId: number, filePath: string, fileContent: string): GeneratedFile => {
    const files = getItem<GeneratedFile[]>('generatedFiles', []);
    const now = new Date().toISOString();
    
    // Verificar si el archivo ya existe
    const existingIndex = files.findIndex(f => f.project_id === projectId && f.file_path === filePath);
    
    if (existingIndex !== -1) {
      // Actualizar archivo existente
      const updatedFile = {
        ...files[existingIndex],
        file_content: fileContent,
        updated_at: now
      };
      
      files[existingIndex] = updatedFile;
      setItem('generatedFiles', files);
      
      return updatedFile;
    } else {
      // Crear nuevo archivo
      const maxId = files.reduce((max, f) => Math.max(max, f.id), 0);
      const newId = maxId + 1;
      
      const newFile: GeneratedFile = {
        id: newId,
        project_id: projectId,
        file_path: filePath,
        file_content: fileContent,
        created_at: now,
        updated_at: now
      };
      
      files.push(newFile);
      setItem('generatedFiles', files);
      
      return newFile;
    }
  },
  
  deleteFilesByProjectId: (projectId: number): boolean => {
    const files = getItem<GeneratedFile[]>('generatedFiles', []);
    const filteredFiles = files.filter(f => f.project_id !== projectId);
    
    if (filteredFiles.length === files.length) return false;
    
    setItem('generatedFiles', filteredFiles);
    return true;
  }
};
