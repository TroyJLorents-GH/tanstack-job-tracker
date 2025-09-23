import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { useJobApplications, useDeleteJobApplication } from '../hooks/useJobApplications';
import type { JobApplication, JobStage } from '../types/job';

const columnHelper = createColumnHelper<JobApplication>();

const stageColors = {
  applied: 'bg-blue-100 text-blue-800',
  phone_screen: 'bg-yellow-100 text-yellow-800',
  technical_interview: 'bg-purple-100 text-purple-800',
  onsite_interview: 'bg-indigo-100 text-indigo-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
} as const;

const stageLabels = {
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  technical_interview: 'Technical Interview',
  onsite_interview: 'Onsite Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
} as const;

export function JobList() {
  const { data: jobs = [], isLoading, error } = useJobApplications();
  const deleteJob = useDeleteJobApplication();
  const [globalFilter, setGlobalFilter] = useState('');
  const [stageFilter, setStageFilter] = useState<JobStage | 'all'>('all');

  const columns = useMemo(
    () => [
      columnHelper.accessor('company', {
        header: 'Company',
        cell: (info) => (
          <div className="font-medium text-gray-900">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor('position', {
        header: 'Position',
        cell: (info) => (
          <div className="text-gray-700">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor('appliedDate', {
        header: 'Applied Date',
        cell: (info) => (
          <div className="text-gray-600">
            {format(new Date(info.getValue()), 'MMM dd, yyyy')}
          </div>
        ),
      }),
      columnHelper.accessor('stage', {
        header: 'Stage',
        cell: (info) => {
          const stage = info.getValue();
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors[stage as keyof typeof stageColors]}`}>
              {stageLabels[stage as keyof typeof stageLabels]}
            </span>
          );
        },
      }),
      columnHelper.accessor('location', {
        header: 'Location',
        cell: (info) => (
          <div className="text-gray-600">{info.getValue() || '-'}</div>
        ),
      }),
      columnHelper.accessor('salary', {
        header: 'Salary',
        cell: (info) => (
          <div className="text-gray-600">{info.getValue() || '-'}</div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex space-x-2">
            <Link
              to="/jobs/$jobId"
              params={{ jobId: info.row.original.id }}
              className="text-blue-600 hover:text-blue-900"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              to="/jobs/$jobId/edit"
              params={{ jobId: info.row.original.id }}
              className="text-gray-600 hover:text-gray-900"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this job application?')) {
                  deleteJob.mutate(info.row.original.id);
                }
              }}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      }),
    ],
    [deleteJob]
  );

  const filteredData = useMemo(() => {
    let filtered = jobs;
    
    if (stageFilter !== 'all') {
      filtered = filtered.filter(job => job.stage === stageFilter);
    }
    
    if (globalFilter) {
      filtered = filtered.filter(job =>
        job.company.toLowerCase().includes(globalFilter.toLowerCase()) ||
        job.position.toLowerCase().includes(globalFilter.toLowerCase()) ||
        job.location?.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [jobs, globalFilter, stageFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600">Error loading job applications</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Job Applications</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track your job applications, interviews, and progress
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/jobs/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Job Application
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search companies, positions, or locations..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as JobStage | 'all')}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Stages</option>
            {Object.entries(stageLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No job applications found</div>
        </div>
      )}
    </div>
  );
}
