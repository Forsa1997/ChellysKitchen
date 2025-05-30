import { Box, Paper, Typography, Avatar, AvatarGroup, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Card } from './MainContent';
import { useEffect } from 'react';

interface RecipeDetailViewProps {
    recipe: Card;
    onClose: () => void;
}

export function RecipeDetailView({ recipe, onClose }: RecipeDetailViewProps) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
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
                    {/* Header Bereich */}
                    <img src={recipe.img} alt={recipe.title}   style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        marginBottom: '24px'
                    }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h4" component="h1">{recipe.title}</Typography>
                        <Typography variant="subtitle1">
                            {recipe.tag}
                        </Typography>
                    </Box>

                    {/* Rezept-Info */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Zubereitungszeit</Typography>
                            <Typography>{recipe.preparationTime + recipe.cookingTime} Min.</Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Schwierigkeit</Typography>
                            <Typography>{recipe.difficulty}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Portionen</Typography>
                            <Typography>{recipe.servings}</Typography>
                        </Box>
                    </Box>

                    {/* Kurzbeschreibung */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="body1">{recipe.shortDescription}</Typography>
                    </Box>

                    {/* Zutaten */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Zutaten</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                            {recipe.ingredients.map((ingredient, index) => (
                                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography>{ingredient.name}</Typography>
                                    <Typography>{`${ingredient.amount} ${ingredient.unit}`}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Zubereitungsschritte */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Zubereitung</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {recipe.steps.map((step) => (
                                <Box key={step.stepNumber}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        Schritt {step.stepNumber}
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        {step.instruction}
                                    </Typography>
                                    {step.tip && (
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                color: 'info.main',
                                                bgcolor: 'info.lighter',
                                                p: 1,
                                                borderRadius: 1
                                            }}
                                        >
                                            Tipp: {step.tip}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Nährwerte */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Nährwerte pro Portion</Typography>
                        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <Typography>Kalorien: {recipe.nutritionalValues.calories} kcal</Typography>
                            <Typography>Protein: {recipe.nutritionalValues.protein}g</Typography>
                            <Typography>Kohlenhydrate: {recipe.nutritionalValues.carbohydrates}g</Typography>
                            <Typography>Fett: {recipe.nutritionalValues.fat}g</Typography>
                        </Box>
                    </Box>

                    {/* Autor-Info (bleibt unverändert) */}
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
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}