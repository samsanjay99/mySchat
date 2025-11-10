import { useState } from 'react';
import { Trash2, HardDrive, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface StorageInfo {
  usedBytes: number;
  usedMB: number;
  limitBytes: number;
  limitMB: number;
  percentageUsed: number;
  fileCount: number;
}

interface StorageManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StorageManager = ({ open, onOpenChange }: StorageManagerProps) => {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  // Fetch storage info
  const { data: storageInfo, isLoading } = useQuery<StorageInfo>({
    queryKey: ['/api/storage/info'],
    queryFn: async () => {
      const token = localStorage.getItem('schat_token');
      const res = await fetch('/api/storage/info', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch storage info');
      return res.json();
    },
    enabled: open,
  });

  // Clear storage mutation
  const clearStorageMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('schat_token');
      const res = await fetch('/api/storage/clear', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to clear storage');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Storage Cleared',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/storage/info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setIsClearing(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsClearing(false);
    },
  });

  const handleClearStorage = () => {
    if (confirm('Are you sure you want to clear all your uploaded files? This action cannot be undone.')) {
      setIsClearing(true);
      clearStorageMutation.mutate();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStorageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getStorageStatus = (percentage: number) => {
    if (percentage >= 90) return { text: 'Critical', color: 'text-red-600' };
    if (percentage >= 70) return { text: 'Warning', color: 'text-orange-600' };
    return { text: 'Good', color: 'text-green-600' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5" />
            <span>Storage Management</span>
          </DialogTitle>
          <DialogDescription>
            Manage your file storage and free up space
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            Loading storage information...
          </div>
        ) : storageInfo ? (
          <div className="space-y-6">
            {/* Storage Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Storage Used</span>
                <span className="font-semibold">
                  {formatBytes(storageInfo.usedBytes)} / {storageInfo.limitMB} MB
                </span>
              </div>
              
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getStorageColor(storageInfo.percentageUsed)}`}
                  style={{ width: `${storageInfo.percentageUsed}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${getStorageStatus(storageInfo.percentageUsed).color}`}>
                  {getStorageStatus(storageInfo.percentageUsed).text}
                </span>
                <span className="text-gray-500">
                  {storageInfo.percentageUsed.toFixed(1)}% used
                </span>
              </div>
            </div>

            {/* Storage Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Files Uploaded</p>
                <p className="text-2xl font-bold text-gray-900">{storageInfo.fileCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Space Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatBytes(storageInfo.limitBytes - storageInfo.usedBytes)}
                </p>
              </div>
            </div>

            {/* Warning Message */}
            {storageInfo.percentageUsed >= 70 && (
              <div className="flex items-start space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-900">Storage Almost Full</p>
                  <p className="text-orange-700 mt-1">
                    {storageInfo.percentageUsed >= 90 
                      ? 'You need to clear some files to upload new ones.'
                      : 'Consider clearing old files to free up space.'}
                  </p>
                </div>
              </div>
            )}

            {/* Clear Storage Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Clearing storage will permanently delete all your uploaded files and images from all chats. Messages will remain intact.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Failed to load storage information
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button
            onClick={handleClearStorage}
            disabled={isClearing || !storageInfo || storageInfo.fileCount === 0}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isClearing ? 'Clearing...' : 'Clear All Files'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
