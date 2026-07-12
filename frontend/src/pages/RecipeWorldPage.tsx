import { Canvas } from '@react-three/fiber';
import { Float, Html, OrbitControls } from '@react-three/drei';
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography, useColorScheme } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { useMemo, useState } from 'react';
import type { Recipe } from '../types/domain';
import { useQueryRecipes } from '../recipes/useQueryRecipes';
import { totalRecipeMinutes } from '../recipes/recipeCardViewModel';

const stationColors = ['#e87a93', '#e6a73a', '#6aa986', '#6d9dcc', '#9a7abb'];

function recipeHref(slug: string) {
  const routerMode = import.meta.env.VITE_ROUTER_MODE ?? (import.meta.env.PROD ? 'hash' : 'browser');
  const path = `/recipes/${slug}`;
  return routerMode === 'hash' ? `#${path}` : path;
}

function Station({ recipe, index }: { recipe: Recipe; index: number }) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  const x = (column - 1.5) * 3.4;
  const z = (row - 0.5) * 3.2;
  const color = stationColors[index % stationColors.length];

  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.35}>
      <group position={[x, 0.45, z]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.85, 1.15, 0.45, 6]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <sphereGeometry args={[0.52, 24, 24]} />
          <meshStandardMaterial color="#fff8eb" roughness={0.35} metalness={0.08} />
        </mesh>
        <Html position={[0, 1.45, 0]} center distanceFactor={9} transform>
          <Box
            component="a"
            href={recipeHref(recipe.slug)}
            aria-label={`${recipe.title} entdecken`}
            sx={{
              display: 'block', width: 154, p: 1, borderRadius: 2, textAlign: 'center',
              color: '#321821', bgcolor: 'rgba(255,255,255,0.93)', textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(50,24,33,0.2)', fontSize: 13, fontWeight: 800,
              '&:focus-visible': { outline: '3px solid #e05d7c', outlineOffset: 3 },
            }}
          >
            {recipe.title}
          </Box>
        </Html>
      </group>
    </Float>
  );
}

function RecipeWorldScene({ recipes, darkMode }: { recipes: Recipe[]; darkMode: boolean }) {
  const background = darkMode ? '#2b1d23' : '#f8dfe2';
  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 10, 26]} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[5, 8, 4]} intensity={2.2} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color={darkMode ? '#294336' : '#b9ddb5'} roughness={0.95} />
      </mesh>
      {recipes.map((recipe, index) => <Station key={recipe.id} recipe={recipe} index={index} />)}
      <OrbitControls enablePan={false} minDistance={7} maxDistance={14} minPolarAngle={0.75} maxPolarAngle={1.25} />
    </>
  );
}

export function RecipeWorldPage() {
  const { recipes, loading, error } = useQueryRecipes({ pageSize: 48, sort: 'newest' });
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const { mode, systemMode } = useColorScheme();
  const darkMode = (mode === 'system' ? systemMode : mode) === 'dark';
  const categories = useMemo(() => ['Alle', ...Array.from(new Set(recipes.map((recipe) => recipe.category)))], [recipes]);
  const visibleRecipes = selectedCategory === 'Alle' ? recipes : recipes.filter((recipe) => recipe.category === selectedCategory);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="p" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Spielmodus
        </Typography>
        <Typography variant="h2" component="h1" sx={{ mt: 0.5, fontSize: { xs: '2.25rem', sm: '3.25rem' }, fontWeight: 800 }}>
          Rezeptwelt
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
          Entdecke Rezepte als kleine Inseln. Drehe die Welt, zoome hinein und wähle eine Station aus.
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} useFlexGap aria-label="Rezeptwelt filtern" sx={{ flexWrap: 'wrap' }}>
        {categories.map((category) => (
          <Button key={category} size="small" variant={selectedCategory === category ? 'contained' : 'tonal'} onClick={() => setSelectedCategory(category)} sx={{ borderRadius: 999 }}>
            {category}
          </Button>
        ))}
      </Stack>

      {loading ? (
        <Paper sx={{ minHeight: 420, display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Rezeptwelt wird geladen" /></Paper>
      ) : error ? (
        <Paper sx={{ p: 4 }}><Typography color="error">Die Rezeptwelt konnte nicht geladen werden: {error}</Typography></Paper>
      ) : visibleRecipes.length === 0 ? (
        <Paper sx={{ p: 4 }}><Typography variant="h6">Noch keine Stationen in Sicht.</Typography><Typography color="text.secondary">Lege zuerst ein Rezept an oder wähle eine andere Kategorie.</Typography></Paper>
      ) : (
        <>
          <Box
            aria-label="Interaktive 3D-Rezeptwelt"
            sx={{ position: 'relative', height: { xs: 420, sm: 560 }, overflow: 'hidden', borderRadius: 6, boxShadow: 5, border: '1px solid', borderColor: 'divider' }}
          >
            <Canvas shadows camera={{ position: [0, 9, 11], fov: 44 }} dpr={[1, 1.5]}>
              <RecipeWorldScene recipes={visibleRecipes} darkMode={darkMode} />
            </Canvas>
            <Chip label="Ziehen zum Drehen" sx={{ position: 'absolute', left: 16, bottom: 16, bgcolor: 'background.paper', boxShadow: 2 }} />
          </Box>
          <Paper component="section" aria-label="Rezeptstationen" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Stationenliste</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Alternative zur 3D-Ansicht – vollständig per Tastatur bedienbar.</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {visibleRecipes.map((recipe) => (
                <Chip key={recipe.id} component={RouterLink} to={`/recipes/${recipe.slug}`} clickable label={`${recipe.title} entdecken · ${totalRecipeMinutes(recipe.preparationTime, recipe.cookingTime)} Min.`} aria-label={`${recipe.title} entdecken`} />
              ))}
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
  );
}
