# Job Application Tracker

A modern, full-featured job application tracking system built with TanStack technologies and React.

## Features

- **Job Application Management**: Add, edit, and delete job applications
- **Advanced Filtering**: Filter by company, position, location, and application stage
- **Status Tracking**: Track applications through different stages (Applied, Phone Screen, Technical Interview, etc.)
- **Interview Prep Notes**: Add and manage interview preparation notes for each application
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **Real-time Data**: Powered by TanStack Query for efficient data management
- **Smooth Navigation**: TanStack Router for seamless page transitions

## Tech Stack

- **React 18** with TypeScript
- **TanStack Query** (React Query) for server state management
- **TanStack Table** for data display and filtering
- **TanStack Router** for client-side routing
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Date-fns** for date formatting
- **Vite** for build tooling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd job-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── Root.tsx        # Main layout component
│   ├── JobList.tsx     # Job applications table
│   ├── JobDetail.tsx   # Individual job view
│   └── JobForm.tsx     # Add/edit job form
├── hooks/              # Custom React hooks
│   └── useJobApplications.ts  # TanStack Query hooks
├── services/           # API services
│   └── api.ts         # Mock API implementation
├── types/              # TypeScript type definitions
│   └── job.ts         # Job application types
├── App.tsx            # Main app component
├── router.tsx         # TanStack Router configuration
└── index.css          # Global styles
```

## Features in Detail

### Job Application Management

- **Create**: Add new job applications with company, position, applied date, stage, and additional details
- **Edit**: Update existing applications with new information
- **Delete**: Remove applications from your tracker
- **View**: Detailed view of each application with all information

### Advanced Filtering & Search

- **Global Search**: Search across company names, positions, and locations
- **Stage Filtering**: Filter by application stage (Applied, Phone Screen, Technical Interview, etc.)
- **Sortable Table**: Sort by any column in the job applications table

### Interview Preparation

- **Add Notes**: Create interview preparation notes for each job application
- **Organize**: Keep your interview prep organized by job
- **Track Progress**: See when notes were created and manage your preparation

### Data Persistence

Currently uses a mock API with in-memory storage. The application is designed to easily integrate with:
- REST APIs
- GraphQL endpoints
- Local storage
- Database backends

## API Integration

The application uses a mock API service that can be easily replaced with real API calls. The service includes:

- `getJobApplications()` - Fetch all job applications
- `getJobApplication(id)` - Fetch a single job application
- `createJobApplication(data)` - Create a new job application
- `updateJobApplication(id, data)` - Update an existing job application
- `deleteJobApplication(id)` - Delete a job application
- `addInterviewPrep(jobId, title, content)` - Add interview prep notes

## Customization

### Adding New Stages

To add new application stages, update the `JobStage` type in `src/types/job.ts`:

```typescript
export type JobStage = 
  | 'applied'
  | 'phone_screen'
  | 'technical_interview'
  | 'onsite_interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'your_new_stage';  // Add your new stage
```

### Styling

The application uses Tailwind CSS for styling. You can customize the design by:
- Modifying the color scheme in `tailwind.config.js`
- Updating component styles in the respective `.tsx` files
- Adding custom CSS classes in `src/index.css`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding Features

1. **New Components**: Create new components in the `src/components/` directory
2. **New Routes**: Add routes in `src/router.tsx`
3. **New API Endpoints**: Extend the API service in `src/services/api.ts`
4. **New Types**: Add TypeScript types in `src/types/` directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Future Enhancements

- [ ] Real backend integration (Node.js/Express, Python/FastAPI, etc.)
- [ ] User authentication and multi-user support
- [ ] Email notifications for application updates
- [ ] Calendar integration for interview scheduling
- [ ] Resume/CV upload and management
- [ ] Analytics and reporting dashboard
- [ ] Mobile app (React Native)
- [ ] Export functionality (PDF, CSV)
- [ ] Dark mode support
- [ ] Offline support with service workers
