import { useState } from "react";
import { useLocation } from "wouter";
import { ArticleCard } from "@/components/ArticleCard";
import { BackgroundDecorations } from "@/components/BackgroundDecorations";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDownloads, useDeleteDownload } from "@/hooks/useDownloads";
import { usePreferences } from "@/hooks/usePreferences";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DownloadsPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { data, isLoading } = useDownloads();
  const { data: prefsData } = usePreferences();
  const deleteDownload = useDeleteDownload();
  const { toast } = useToast();

  const downloads = data?.downloads || [];
  const fontFamily = prefsData?.preferences?.fontFamily || 'sans';
  
  const filteredDownloads = downloads.filter(download =>
    download.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = (id: string) => {
    setLocation(`/reader/${id}`);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteDownload.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Download Deleted",
            description: "Article removed from your downloads",
          });
          setDeleteId(null);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete download",
            variant: "destructive",
          });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <BackgroundDecorations />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Downloaded Articles
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Access your saved articles offline
          </p>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search downloads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-downloads"
            />
          </div>
        </div>

        {filteredDownloads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredDownloads.map((download) => (
              <ArticleCard
                key={download.id}
                download={download}
                onOpen={handleOpen}
                onDelete={handleDelete}
                fontFamily={fontFamily}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-lg text-muted-foreground mb-4">
              {searchQuery ? 'No downloads match your search' : 'No downloaded articles yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              {!searchQuery && 'Search for articles and download them to read offline'}
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Download?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this article and all its annotations from your downloads.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
