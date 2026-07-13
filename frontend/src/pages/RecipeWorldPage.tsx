import { Canvas } from '@react-three/fiber';
import { Float, Html, OrbitControls, Sparkles } from '@react-three/drei';
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography, useColorScheme } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { useMemo, useState } from 'react';
import type { Recipe } from '../types/domain';
import { useQueryRecipes } from '../recipes/useQueryRecipes';
import { totalRecipeMinutes } from '../recipes/recipeCardViewModel';
import { dishKindLabels, dishSeed, pickDishKind } from './recipeWorld/dishKind';
import { DishModel } from './recipeWorld/DishModel';

const stationColors = ['#e87a93', '#e6a73a', '#6aa986', '#6d9dcc', '#9a7abb'];

function recipeHref(slug: string) {
  const routerMode = import.meta.env.VITE_ROUTER_MODE ?? (import.meta.env.PROD ? 'hash' : 'browser');
  const path = `/recipes/${slug}`;
  return routerMode === 'hash' ? `#${path}` : path;
}

function Station({ recipe, index }: { recipe: Recipe; index: number }) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  const x = (column - 1.5) * 3.4 + (row % 2 ? 1.1 : 0);
  const z = (row - 0.5) * 3.9;
  const color = stationColors[index % stationColors.length];
  const kind = pickDishKind(recipe);
  const seed = dishSeed(recipe.slug);

  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.35}>
      <group position={[x, 0.45, z]}>
        {/* Floating island: grass plateau on an earthy base */}
        <mesh position={[0, -0.32, 0]} castShadow>
          <cylinderGeometry args={[1.05, 0.45, 0.7, 7]} />
          <meshStandardMaterial color="#8a6a4f" roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow>
          <cylinderGeometry args={[1.15, 1.05, 0.22, 7]} />
          <meshStandardMaterial color="#7bb661" roughness={0.8} flatShading />
        </mesh>
        {/* Picnic blanket in the station color, the dish sits on top */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.03, 20]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <group position={[0, 0.14, 0]} scale={0.92}>
          <DishModel kind={kind} seed={seed} />
        </group>
        <Html position={[0, 1.5, 0]} center distanceFactor={7} transform>
          <Box
            component="a"
            href={recipeHref(recipe.slug)}
            aria-label={`${recipe.title} entdecken`}
            sx={{
              display: 'block', width: 136, p: 0.75, borderRadius: 2, textAlign: 'center',
              color: '#321821', bgcolor: 'rgba(255,255,255,0.93)', textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(50,24,33,0.2)', fontSize: 13, fontWeight: 800,
              '&:focus-visible': { outline: '3px solid #e05d7c', outlineOffset: 3 },
            }}
          >
            {recipe.title}
            <Box component="span" sx={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#8a5b68', mt: 0.25 }}>
              {dishKindLabels[kind]} · {totalRecipeMinutes(recipe.preparationTime, recipe.cookingTime)} Min.
            </Box>
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
      <ambientLight intensity={0.85} />
      <hemisphereLight args={[darkMode ? '#5a4a63' : '#fff3df', darkMode ? '#1f3328' : '#9cc79a', 0.9]} />
      <directionalLight position={[5, 8, 4]} intensity={2.2} castShadow />
      <directionalLight position={[-6, 4, -5]} intensity={0.6} color={darkMode ? '#b78ad0' : '#ffd9c2'} />
      <Sparkles count={darkMode ? 90 : 45} scale={[20, 6, 16]} position={[0, 3, 0]} size={2.2} speed={0.35} color={darkMode ? '#f5d6a8' : '#ffffff'} opacity={0.55} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial color={darkMode ? '#294336' : '#b9ddb5'} roughness={0.95} />
      </mesh>
      {recipes.map((recipe, index) => <Station key={recipe.id} recipe={recipe} index={index} />)}
      <OrbitControls enablePan={false} minDistance={7} maxDistance={16} minPolarAngle={0.75} maxPolarAngle={1.25} />
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
          Entdecke Rezepte als kleine Inseln – jede Station serviert ein 3D-Gericht passend zum Rezept. Drehe die Welt, zoome hinein und wähle eine Station aus.
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
            <Canvas shadows camera={{ position: [0, 10, 12], fov: 44 }} dpr={[1, 1.5]}>
              <RecipeWorldScene recipes={visibleRecipes} darkMode={darkMode} />
            </Canvas>
            <Chip label="Ziehen zum Drehen" sx={{ position: 'absolute', left: 16, bottom: 16, bgcolor: 'background.paper', boxShadow: 2 }} />
          </Box>
          <Paper component="section" aria-label="Rezeptstationen" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Stationenliste</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Alternative zur 3D-Ansicht – vollständig per Tastatur bedienbar.</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {visibleRecipes.map((recipe) => (
                <Chip key={recipe.id} component={RouterLink} to={`/recipes/${recipe.slug}`} clickable label={`${recipe.title} entdecken · ${dishKindLabels[pickDishKind(recipe)]} · ${totalRecipeMinutes(recipe.preparationTime, recipe.cookingTime)} Min.`} aria-label={`${recipe.title} entdecken`} />
              ))}
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
  );
}
