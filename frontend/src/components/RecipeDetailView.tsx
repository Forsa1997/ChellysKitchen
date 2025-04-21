import { Box, Paper, Typography, Avatar, AvatarGroup, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Card } from './MainContent';
import { useEffect } from 'react';

interface RecipeDetailViewProps {
    recipe: Card;
    onClose: () => void;
}

export function RecipeDetailView({ recipe, onClose }: RecipeDetailViewProps) {
    // Verwaltet das Scrolling-Verhalten des Body
    useEffect(() => {
        // Deaktiviert Scrolling auf dem Body wenn das Modal geöffnet ist
        document.body.style.overflow = 'hidden';

        // Cleanup: Aktiviert Scrolling wieder wenn Modal geschlossen wird
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1300,
            }}
            onClick={onClose}
        >
            <Paper
                elevation={6}
                sx={{
                    position: 'relative',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    m: 2,
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#888',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: '#666',
                    },
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Box sx={{ p: 4 }}>
                    <img
                        src={recipe.img}
                        alt={recipe.title}
                        style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '8px',
                            marginBottom: '24px'
                        }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h4" component="h1">
                            {recipe.title}
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                backgroundColor: 'primary.main',
                                color: 'white',
                                px: 2,
                                py: 0.5,
                                borderRadius: '16px'
                            }}
                        >
                            {recipe.tag}
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <Typography variant="body1">
                            {recipe.description}
                        </Typography>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        pt: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AvatarGroup max={3}>
                                {recipe.authors.map((author, index) => (
                                    <Avatar
                                        key={index}
                                        alt={author.name}
                                        src={author.avatar}
                                    />
                                ))}
                            </AvatarGroup>
                            <Box>
                                <Typography variant="subtitle2">
                                    {recipe.authors.map(author => author.name).join(', ')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {`${recipe.creationDate.getDate()}.${recipe.creationDate.getMonth() + 1}.${recipe.creationDate.getFullYear()}`}
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="subtitle2" color="primary">
                            {recipe.category}
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}