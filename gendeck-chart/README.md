# GenDeck Helm Chart

A Helm chart for deploying GenDeck AI Slide Generator on Kubernetes.

## Prerequisites

- Kubernetes 1.24+
- Helm 3.12+
- PostgreSQL (for database persistence features)

## Quick Start

### Build Images

```bash
# Build frontend image
docker build -t gendeck-frontend:latest .

# Build backend image
docker build -t gendeck-backend:latest ./server

# For minikube - load images into cluster
minikube image load gendeck-frontend:latest
minikube image load gendeck-backend:latest

# For cloud clusters, push to registry
docker tag gendeck-frontend:latest your-registry/gendeck-frontend:v1.0.0
docker push your-registry/gendeck-frontend:v1.0.0
docker tag gendeck-backend:latest your-registry/gendeck-backend:v1.0.0
docker push your-registry/gendeck-backend:v1.0.0
```

### Deploy with Helm

**Local Testing (with port-forward):**

```bash
# Setup PostgreSQL first
./scripts/setup-db.sh --docker

# Deploy with in-cluster backend URL
helm upgrade --install gendeck ./gendeck-chart \
  --set frontend.apiUrl=http://localhost:3001/api \
  --set database.password=your-password \
  --set database.host=host.docker.internal

# Port forward both services
kubectl port-forward svc/gendeck-frontend 3000:3000 &
kubectl port-forward svc/gendeck-backend 3001:3001 &

# Access http://localhost:3000
```

**Production (with external domain):**

```bash
helm upgrade --install gendeck ./gendeck-chart \
  --set frontend.apiUrl=https://api.example.com/api \
  --set database.url="postgresql://user:pass@host:5432/gendeck" \
  --set apiKeys.gemini=your-gemini-key
```

**With NodePort:**

```bash
helm upgrade --install gendeck ./gendeck-chart \
  --set frontend.apiUrl=http://$(minikube ip):30001/api \
  --set database.password=your-password \
  --set service.frontend.type=NodePort \
  --set service.backend.type=NodePort
```

## Configuration

### Frontend API URL (Required)

The `frontend.apiUrl` value configures the backend URL that the browser will use:

```yaml
frontend:
  apiUrl: "http://localhost:3001/api"  # For local port-forward
  # apiUrl: "https://api.example.com/api"  # For production
  # apiUrl: "http://gendeck-backend:3001/api"  # In-cluster URL
```

**Important**: This URL must be accessible from the browser, not just from within the cluster.

### Database Options

**Individual Parameters:**
```yaml
database:
  host: "prod-postgres.example.com"
  port: 5432
  name: "gendeck"
  user: "gendeck_user"
  password: "your-secure-password"
```

**Connection URL (Recommended for Cloud DBs):**
```yaml
database:
  url: "postgresql://user:password@host:port/database?sslmode=require"
```

**Examples:**
```yaml
# AWS RDS
database:
  url: "postgresql://gendeck:password@xxx.us-east-1.rds.amazonaws.com:5432/gendeck?sslmode=require"

# Supabase
database:
  url: "postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres?sslmode=require"

# Google Cloud SQL
database:
  url: "postgresql://gendeck:password@xxx/gendeck?sslmode=require&host=/cloudsql/project:region:instance"
```

### Using Private Registry

```yaml
# values.yaml
global:
  imageRegistry: "registry.example.com"
  imagePullSecrets:
    - my-registry-secret

image:
  frontend:
    repository: my-project/gendeck-frontend
    tag: v1.0.0
  backend:
    repository: my-project/gendeck-backend
    tag: v1.0.0
```

### Autoscaling

```yaml
# values.yaml
autoscaling:
  frontend:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
  backend:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
```

### Service Types

```yaml
service:
  frontend:
    type: ClusterIP  # Options: ClusterIP, NodePort, LoadBalancer
    port: 3000
  backend:
    type: ClusterIP
    port: 3001
```

## Values Reference

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.apiUrl` | Backend API URL for frontend (browser-accessible) | `http://localhost:3001/api` |
| `image.frontend.repository` | Frontend image repository | `gendeck-frontend` |
| `image.frontend.tag` | Frontend image tag | `latest` |
| `image.backend.repository` | Backend image repository | `gendeck-backend` |
| `image.backend.tag` | Backend image tag | `latest` |
| `replicaCount.frontend` | Frontend replicas | `1` |
| `replicaCount.backend` | Backend replicas | `1` |
| `database.host` | PostgreSQL host | `pg-cluster-postgresql-postgresql.demo.svc` |
| `database.port` | PostgreSQL port | `5432` |
| `database.name` | Database name | `gendeck` |
| `database.user` | Database user | `gendeck_app` |
| `database.password` | Database password | `your_secure_password_here` |
| `database.url` | Full connection URL | `""` |
| `apiKeys.gemini` | Google Gemini API key | `""` |
| `apiKeys.openai` | OpenAI API key | `""` |
| `apiKeys.deepseek` | DeepSeek API key | `""` |
| `apiKeys.anthropic` | Anthropic API key | `""` |
| `apiKeys.moonshot` | Moonshot API key | `""` |

See [values.yaml](./values.yaml) for full configuration options.

## Production Deployment

```bash
# Production deployment with external database
helm upgrade --install gendeck ./gendeck-chart \
  --set frontend.apiUrl=https://api.example.com/api \
  --set database.url="$DATABASE_URL" \
  --set apiKeys.gemini="$GEMINI_API_KEY"
```

## Uninstallation

```bash
helm uninstall gendeck
```

## Upgrade

```bash
helm upgrade gendeck ./gendeck-chart
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -l app.kubernetes.io/name=gendeck
```

### View Logs

```bash
# Frontend logs
kubectl logs -l app.kubernetes.io/component=frontend

# Backend logs
kubectl logs -l app.kubernetes.io/component=backend
```

### Port Forward for Testing

```bash
# Access frontend directly
kubectl port-forward svc/gendeck-frontend 3000:3000

# Access backend API directly
kubectl port-forward svc/gendeck-backend 3001:3001
```

### Test Backend Health

```bash
# Via port-forward
curl http://localhost:3001/api/health
```

## Development

### Packaging Chart

```bash
helm package ./gendeck-chart
```

### Linting Chart

```bash
helm lint ./gendeck-chart
```

### Template Rendering

```bash
helm template gendeck ./gendeck-chart \
  --set frontend.apiUrl=http://localhost:3001/api \
  --set database.password=test
```

## Architecture

```
┌─────────────────────────────────────┐
│         Browser                     │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│    Frontend Service (port 3000)     │
│    - serve static files             │
│    - /config.json -> VITE_API_URL   │
└─────────────┬───────────────────────┘
              │ http://backend:3001/api
┌─────────────▼───────────────────────┐
│    Backend Service (port 3001)      │
│    - API server                     │
│    - connects to PostgreSQL         │
└─────────────────────────────────────┘
```

The frontend and backend are deployed as separate Deployments, allowing independent scaling. The frontend `VITE_API_URL` is configured at runtime via the `frontend.apiUrl` Helm value.
