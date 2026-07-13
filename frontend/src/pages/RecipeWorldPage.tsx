import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls, Sparkles } from '@react-three/drei';
import { Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, Typography, useColorScheme, useMediaQuery, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { Link as RouterLink } from 'react-router';
import { useMemo, useRef, useState } from 'react';
import type { Recipe } from '../types/domain';
import { useQueryRecipes } from '../recipes/useQueryRecipes';
import { totalRecipeMinutes } from '../recipes/recipeCardViewModel';
import { dishKindLabels, dishSeed, pickDishKind } from './recipeWorld/dishKind';
import { FoodTruck } from './recipeWorld/FoodTruck';
import { FestivalScene } from './recipeWorld/FestivalScene';
import { festivalPositions, type TruckSpot } from './recipeWorld/festivalLayout';
import { orbitPosition, zoomPosition, type Vec3 } from './recipeWorld/cameraControls';

const INITIAL_CAMERA: Vec3 = [0, 8.5, 17];
const INITIAL_CAMERA_MOBILE: Vec3 = [0, 11, 24];
const CAMERA_TARGET: Vec3 = [0, 1.2, -1];
const MIN_DISTANCE = 6;
const MAX_DISTANCE = 30;

function recipeHref(slug: string) {
  const routerMode = import.meta.env.VITE_ROUTER_MODE ?? (import.meta.env.PROD ? 'hash' : 'browser');
  const path = `/recipes/${slug}`;
  return routerMode === 'hash' ? `#${path}` : path;
}

function TruckStation({ recipe, spot }: { recipe: Recipe; spot: TruckSpot }) {
  const kind = pickDishKind(recipe);
  const seed = dishSeed(recipe.slug);

  return (
    <group position={[spot.x, 0, spot.z]} rotation={[0, spot.rotationY, 0]}>
      <FoodTruck kind={kind} seed={seed} onSelect={() => { window.location.href = recipeHref(recipe.slug); }} />
      <Html position={[0, 3.2, 0]} center distanceFactor={10} transform>
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
  );
}

function RecipeWorldScene({ recipes, darkMode }: { recipes: Recipe[]; darkMode: boolean }) {
  const background = darkMode ? '#221b2e' : '#f8dfe2';
  const spots = useMemo(() => festivalPositions(recipes.length), [recipes.length]);

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 16, 42]} />
      <ambientLight intensity={darkMode ? 0.55 : 0.85} />
      <hemisphereLight args={[darkMode ? '#5a4a63' : '#fff3df', darkMode ? '#1f3328' : '#9cc79a', 0.9]} />
      <directionalLight position={[8, 12, 6]} intensity={darkMode ? 1.2 : 2.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 5, -6]} intensity={0.5} color={darkMode ? '#b78ad0' : '#ffd9c2'} />
      <Sparkles count={darkMode ? 110 : 40} scale={[34, 10, 30]} position={[0, 6, -4]} size={2.4} speed={0.3} color={darkMode ? '#f5d6a8' : '#ffffff'} opacity={0.55} />
      <FestivalScene darkMode={darkMode} />
      {recipes.map((recipe, index) => (
        <TruckStation key={recipe.id} recipe={recipe} spot={spots[index]} />
      ))}
    </>
  );
}

interface CameraControlsHandle {
  object: { position: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void } };
  target: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void };
  update: () => void;
}

export function RecipeWorldPage() {
  const { recipes, loading, error } = useQueryRecipes({ pageSize: 48, sort: 'newest' });
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const { mode, systemMode } = useColorScheme();
  const darkMode = (mode === 'system' ? systemMode : mode) === 'dark';
  const categories = useMemo(() => ['Alle', ...Array.from(new Set(recipes.map((recipe) => recipe.category)))], [recipes]);
  const visibleRecipes = selectedCategory === 'Alle' ? recipes : recipes.filter((recipe) => recipe.category === selectedCategory);
  const controlsRef = useRef<CameraControlsHandle | null>(null);
  const theme = useTheme();
  const smallViewport = useMediaQuery(theme.breakpoints.down('sm'));
  const initialCamera = smallViewport ? INITIAL_CAMERA_MOBILE : INITIAL_CAMERA;

  function withControls(mutate: (position: Vec3, target: Vec3) => Vec3) {
    const controls = controlsRef.current;
    if (!controls) return;
    const position: Vec3 = [controls.object.position.x, controls.object.position.y, controls.object.position.z];
    const target: Vec3 = [controls.target.x, controls.target.y, controls.target.z];
    const next = mutate(position, target);
    controls.object.position.set(next[0], next[1], next[2]);
    controls.update();
  }

  const zoom = (factor: number) => withControls((position, target) => zoomPosition(position, target, factor, MIN_DISTANCE, MAX_DISTANCE));
  const orbit = (angle: number) => withControls((position, target) => orbitPosition(position, target, angle));
  const resetView = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...initialCamera);
    controls.target.set(...CAMERA_TARGET);
    controls.update();
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="p" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Foodtruck-Festival
        </Typography>
        <Typography variant="h2" component="h1" sx={{ mt: 0.5, fontSize: { xs: '2.25rem', sm: '3.25rem' }, fontWeight: 800 }}>
          Rezeptwelt
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
          Jedes Rezept hat seinen eigenen Foodtruck auf dem Festivalplatz – mit dem passenden Gericht als rotierendem Dachschild.
          Schau dich um, zoome hinein und tippe einen Truck an, um das Rezept zu öffnen.
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
            aria-label="Interaktives 3D-Foodtruck-Festival"
            sx={{ position: 'relative', height: { xs: 460, sm: 580 }, overflow: 'hidden', borderRadius: 6, boxShadow: 5, border: '1px solid', borderColor: 'divider' }}
          >
            <Canvas shadows camera={{ position: initialCamera, fov: 46 }} dpr={[1, 1.5]}>
              <RecipeWorldScene recipes={visibleRecipes} darkMode={darkMode} />
              <OrbitControls
                ref={(instance) => { controlsRef.current = instance as unknown as CameraControlsHandle | null; }}
                target={CAMERA_TARGET}
                enablePan={false}
                enableDamping
                minDistance={MIN_DISTANCE}
                maxDistance={MAX_DISTANCE}
                minPolarAngle={0.3}
                maxPolarAngle={1.4}
              />
            </Canvas>
            <Chip
              label="Ziehen: umsehen · Kneifen: zoomen · Truck antippen: Rezept öffnen"
              sx={{ position: 'absolute', left: 12, bottom: 12, maxWidth: 'calc(100% - 88px)', bgcolor: 'background.paper', boxShadow: 2 }}
            />
            <Paper
              elevation={3}
              sx={{ position: 'absolute', right: 12, bottom: 12, p: 0.5, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 0.25 }}
            >
              <IconButton aria-label="Hineinzoomen" onClick={() => zoom(0.8)} sx={{ width: 44, height: 44 }}>
                <AddIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Herauszoomen" onClick={() => zoom(1.25)} sx={{ width: 44, height: 44 }}>
                <RemoveIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Nach links drehen" onClick={() => orbit(-Math.PI / 10)} sx={{ width: 44, height: 44 }}>
                <RotateLeftIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Nach rechts drehen" onClick={() => orbit(Math.PI / 10)} sx={{ width: 44, height: 44 }}>
                <RotateRightIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Ansicht zurücksetzen" onClick={resetView} sx={{ width: 44, height: 44 }}>
                <CenterFocusStrongIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Box>
          <Paper component="section" aria-label="Rezeptstationen" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Alle Foodtrucks</Typography>
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
