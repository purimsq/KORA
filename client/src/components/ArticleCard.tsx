import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Trash2 } from "lucide-react";
import type { Download } from "@shared/schema";
import { format } from "date-fns";

interface ArticleCardProps {
  download: Download;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  fontFamily?: string;
}

export function ArticleCard({ download, onOpen, onDelete, fontFamily = 'sans' }: ArticleCardProps) {
  const thumbnailImage = download.images?.[0]?.url || download.thumbnail;

  return (
    <Card 
      className="group overflow-hidden hover-elevate transition-all hover:shadow-xl cursor-pointer"
      data-testid={`card-download-${download.id}`}
    >
      <div onClick={() => onOpen(download.id)}>
        <CardHeader className="p-0">
          <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
            {thumbnailImage ? (
              <img 
                src={thumbnailImage} 
                alt={download.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                data-testid={`img-thumbnail-${download.id}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ExternalLink className="w-12 h-12 text-primary/30" />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <h3 
            className={`font-semibold text-lg mb-2 line-clamp-2 font-${fontFamily}`}
            data-testid={`text-title-${download.id}`}
          >
            {download.title}
          </h3>
          
          {download.abstract && (
            <p className={`text-sm text-muted-foreground line-clamp-3 font-${fontFamily}`}>
              {download.abstract}
            </p>
          )}

          <div className="flex items-center gap-2 mt-4">
            {download.category && (
              <Badge variant="secondary" className="capitalize">
                {download.category}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {download.source.replace('_', ' ')}
            </Badge>
          </div>
        </CardContent>
      </div>

      <CardFooter className="p-6 pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(download.downloadedAt), 'MMM d, yyyy')}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(download.id);
          }}
          className="text-destructive hover:text-destructive"
          data-testid={`button-delete-${download.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
