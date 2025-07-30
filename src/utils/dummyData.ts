import { addDays, subDays, subHours, subMinutes } from 'date-fns'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: {
    type: 'image' | 'audio' | 'file'
    path: string
    mimeType: string
  }[]
}

export interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  provider: string
  model: string
  messages: Message[]
}

const now = new Date()

export const dummyConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Building a React App',
    createdAt: subDays(now, 0),
    updatedAt: subMinutes(now, 5),
    provider: 'openai',
    model: 'gpt-4',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'How do I set up a new React app with TypeScript?',
        timestamp: subMinutes(now, 10),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: `To set up a new React app with TypeScript, you have several options:

## Using Vite (Recommended)
\`\`\`bash
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install
npm run dev
\`\`\`

## Using Create React App
\`\`\`bash
npx create-react-app my-app --template typescript
cd my-app
npm start
\`\`\`

Vite is generally preferred for new projects as it offers faster build times and better development experience.`,
        timestamp: subMinutes(now, 9),
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'What are the main differences between Vite and Create React App?',
        timestamp: subMinutes(now, 5),
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: `Here are the key differences between Vite and Create React App (CRA):

### Build Speed
- **Vite**: Uses native ES modules and esbuild for lightning-fast HMR (Hot Module Replacement)
- **CRA**: Uses webpack which is slower, especially for larger projects

### Bundle Size
- **Vite**: Produces smaller bundles with better tree-shaking
- **CRA**: Larger bundle sizes, though still optimized

### Configuration
- **Vite**: Minimal config out of the box, easy to customize
- **CRA**: Zero-config but requires "ejecting" for customization

### Modern Features
- **Vite**: Built for modern browsers, ES modules by default
- **CRA**: More conservative, broader browser support

For new projects, Vite is usually the better choice unless you need specific CRA features.`,
        timestamp: subMinutes(now, 4),
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Python Data Analysis',
    createdAt: subDays(now, 1),
    updatedAt: subHours(now, 2),
    provider: 'anthropic',
    model: 'claude-3-opus',
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'What\'s the best way to read a large CSV file in Python?',
        timestamp: subHours(now, 3),
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content: `For reading large CSV files in Python, here are the best approaches:

## 1. Using pandas with chunks
\`\`\`python
import pandas as pd

# Read in chunks
chunk_size = 10000
for chunk in pd.read_csv('large_file.csv', chunksize=chunk_size):
    # Process each chunk
    process_data(chunk)
\`\`\`

## 2. Using Dask for parallel processing
\`\`\`python
import dask.dataframe as dd

# Read with Dask
df = dd.read_csv('large_file.csv')
result = df.groupby('column').mean().compute()
\`\`\`

## 3. Using specific columns only
\`\`\`python
# Read only needed columns
df = pd.read_csv('large_file.csv', usecols=['col1', 'col2'])
\`\`\`

Choose based on your specific use case and available memory.`,
        timestamp: subHours(now, 2),
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Database Design Best Practices',
    createdAt: subDays(now, 2),
    updatedAt: subDays(now, 2),
    provider: 'local',
    model: 'llama2',
    messages: [
      {
        id: 'msg-7',
        role: 'user',
        content: 'What are the key principles of database normalization?',
        timestamp: subDays(now, 2),
      },
      {
        id: 'msg-8',
        role: 'assistant',
        content: `Database normalization follows these key principles:

### First Normal Form (1NF)
- Each column contains atomic values
- No repeating groups or arrays
- Each record is unique

### Second Normal Form (2NF)
- Must be in 1NF
- All non-key attributes fully depend on the primary key
- No partial dependencies

### Third Normal Form (3NF)
- Must be in 2NF
- No transitive dependencies
- Non-key columns depend only on the primary key

### Example
Before normalization:
\`OrderID | Customer | Products\`

After normalization:
- Orders table: \`OrderID | CustomerID | Date\`
- Customers table: \`CustomerID | Name | Email\`
- OrderItems table: \`OrderID | ProductID | Quantity\``,
        timestamp: subDays(now, 2),
      },
    ],
  },
  {
    id: 'conv-4',
    title: 'Machine Learning Basics',
    createdAt: subDays(now, 3),
    updatedAt: subDays(now, 3),
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    messages: [
      {
        id: 'msg-9',
        role: 'user',
        content: 'Explain the difference between supervised and unsupervised learning',
        timestamp: subDays(now, 3),
      },
      {
        id: 'msg-10',
        role: 'assistant',
        content: `Here's the key difference between supervised and unsupervised learning:

## Supervised Learning
- **Training**: Uses labeled data (input-output pairs)
- **Goal**: Learn to predict outputs for new inputs
- **Examples**: 
  - Classification (spam detection)
  - Regression (price prediction)
- **Algorithms**: Decision Trees, SVM, Neural Networks

## Unsupervised Learning
- **Training**: Uses unlabeled data
- **Goal**: Find hidden patterns or structure
- **Examples**:
  - Clustering (customer segmentation)
  - Dimensionality reduction (PCA)
- **Algorithms**: K-means, DBSCAN, Autoencoders

## Key Difference
Supervised learning knows what to look for (has labels), while unsupervised learning discovers patterns on its own.`,
        timestamp: subDays(now, 3),
      },
    ],
  },
  {
    id: 'conv-5',
    title: 'Docker Container Setup',
    createdAt: subDays(now, 7),
    updatedAt: subDays(now, 7),
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    messages: [
      {
        id: 'msg-11',
        role: 'user',
        content: 'How do I create a Dockerfile for a Node.js application?',
        timestamp: subDays(now, 7),
      },
      {
        id: 'msg-12',
        role: 'assistant',
        content: `Here's a production-ready Dockerfile for a Node.js application:

\`\`\`dockerfile
# Multi-stage build for smaller image size
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
\`\`\`

This uses multi-stage builds for smaller images and runs as non-root for security.`,
        timestamp: subDays(now, 7),
      },
    ],
  },
]

export const getConversationsByDate = () => {
  const grouped = new Map<string, Conversation[]>()
  
  dummyConversations.forEach(conv => {
    const dateKey = conv.updatedAt.toDateString()
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(conv)
  })
  
  return Array.from(grouped.entries()).sort((a, b) => {
    return new Date(b[0]).getTime() - new Date(a[0]).getTime()
  })
}