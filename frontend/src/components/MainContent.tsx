import * as React from 'react';
import {useState} from 'react';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import {styled} from '@mui/material/styles';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {RecipeDetailView} from "./RecipeDetailView.tsx";


enum Category {
    COOKING = "Cooking",
    BAKING = "Baking",
    BARBEQUE = "Barbeque",
    ALLCATEGORIES = "Allcategories",
}

// Neue Interfaces für das Rezept
interface Ingredient {
    name: string;
    amount: number;
    unit: string;
}

interface NutritionalValue {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
}

interface Author {
    name: string;
    avatar: string;
}

interface RecipeStep {
    stepNumber: number;
    instruction: string;
    tip?: string;
}

export interface Card {
    img: string;
    tag: string;
    title: string;
    shortDescription: string;  // Für die Kartenansicht
    preparationTime: number;   // in Minuten
    cookingTime: number;       // in Minuten
    difficulty: 'Einfach' | 'Mittel' | 'Schwer';
    servings: number;
    ingredients: Ingredient[];
    steps: RecipeStep[];
    nutritionalValues: NutritionalValue;
    authors: Author[];
    category: Category;
    creationDate: Date;
}

const cardData: Card[] = [
    {
        img: 'https://picsum.photos/800/450?random=1',
        tag: 'Kochen',
        title: 'Cremige Pasta mit Spinat und Lachs',
        shortDescription: 'Cremige Pasta mit frischem Spinat und zartem Lachs in einer leichten Weißweinsauce',
        preparationTime: 15,
        cookingTime: 20,
        difficulty: 'Mittel',
        servings: 4,
        ingredients: [
            { name: 'Tagliatelle', amount: 500, unit: 'g' },
            { name: 'Lachs', amount: 400, unit: 'g' },
            { name: 'Spinat', amount: 200, unit: 'g' },
            { name: 'Sahne', amount: 200, unit: 'ml' },
            { name: 'Weißwein', amount: 100, unit: 'ml' },
            { name: 'Knoblauch', amount: 2, unit: 'Zehen' },
            { name: 'Parmesan', amount: 50, unit: 'g' }
        ],
        steps: [
            {
                stepNumber: 1,
                instruction: 'Pasta in Salzwasser nach Packungsanweisung kochen.',
                tip: 'Wasser gut salzen - es sollte wie Meerwasser schmecken'
            },
            {
                stepNumber: 2,
                instruction: 'Lachs in Würfel schneiden und in Olivenöl anbraten.'
            },
            {
                stepNumber: 3,
                instruction: 'Knoblauch fein hacken und zum Lachs geben, mit Weißwein ablöschen.'
            },
            {
                stepNumber: 4,
                instruction: 'Sahne dazugeben und kurz einköcheln lassen, dann Spinat unterheben.'
            },
            {
                stepNumber: 5,
                instruction: 'Pasta unterheben, mit geriebenem Parmesan servieren.'
            }
        ],
        nutritionalValues: {
            calories: 650,
            protein: 35,
            carbohydrates: 70,
            fat: 25
        },
        authors: [
            { name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' },
            { name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' }
        ],
        category: Category.COOKING,
        creationDate: new Date("2024-03-15")
    },
    {
        img: 'https://picsum.photos/800/450?random=2',
        tag: 'Kochen',
        title: 'Mediterrane Quinoa-Bowl',
        shortDescription: 'Gesunde Bowl mit Quinoa, gegrilltem Gemüse und hausgemachtem Hummus',
        preparationTime: 20,
        cookingTime: 25,
        difficulty: 'Einfach',
        servings: 3,
        ingredients: [
            { name: 'Quinoa', amount: 200, unit: 'g' },
            { name: 'Zucchini', amount: 1, unit: 'Stück' },
            { name: 'Aubergine', amount: 1, unit: 'Stück' },
            { name: 'Kirschtomaten', amount: 200, unit: 'g' },
            { name: 'Hummus', amount: 150, unit: 'g' },
            { name: 'Feta', amount: 100, unit: 'g' },
            { name: 'Pinienkerne', amount: 30, unit: 'g' }
        ],
        steps: [
            {
                stepNumber: 1,
                instruction: 'Quinoa nach Packungsanweisung kochen.'
            },
            {
                stepNumber: 2,
                instruction: 'Gemüse in Scheiben schneiden und mit Olivenöl und Kräutern marinieren.',
                tip: 'Mediterranen Kräutermix verwenden für extra Geschmack'
            },
            {
                stepNumber: 3,
                instruction: 'Gemüse auf dem Grill oder in einer Grillpfanne grillen.'
            },
            {
                stepNumber: 4,
                instruction: 'Pinienkerne rösten bis sie goldbraun sind.'
            },
            {
                stepNumber: 5,
                instruction: 'Bowl anrichten: Quinoa als Basis, darauf das gegrillte Gemüse, Hummus, zerbröselten Feta und Pinienkerne.'
            }
        ],
        nutritionalValues: {
            calories: 450,
            protein: 18,
            carbohydrates: 55,
            fat: 20
        },
        authors: [
            { name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }
        ],
        category: Category.COOKING,
        creationDate: new Date("2024-03-10")
    },
    {
        img: 'https://picsum.photos/800/450?random=3',
        tag: 'Backen',
        title: 'Saftige Karottentorte',
        shortDescription: 'Klassische Karottentorte mit cremigem Frischkäse-Frosting',
        preparationTime: 30,
        cookingTime: 45,
        difficulty: 'Mittel',
        servings: 12,
        ingredients: [
            { name: 'Karotten', amount: 300, unit: 'g' },
            { name: 'Mehl', amount: 250, unit: 'g' },
            { name: 'Zucker', amount: 200, unit: 'g' },
            { name: 'Öl', amount: 200, unit: 'ml' },
            { name: 'Eier', amount: 4, unit: 'Stück' },
            { name: 'Frischkäse', amount: 300, unit: 'g' },
            { name: 'Puderzucker', amount: 100, unit: 'g' },
            { name: 'Walnüsse', amount: 100, unit: 'g' }
        ],
        steps: [
            {
                stepNumber: 1,
                instruction: 'Karotten reiben und Walnüsse hacken.'
            },
            {
                stepNumber: 2,
                instruction: 'Eier mit Zucker schaumig schlagen, Öl unterrühren.',
                tip: 'Raumtemperierte Zutaten verwenden'
            },
            {
                stepNumber: 3,
                instruction: 'Mehl und Gewürze unterheben, dann Karotten und Nüsse untermischen.'
            },
            {
                stepNumber: 4,
                instruction: 'Bei 180°C für 45 Minuten backen.',
                tip: 'Stäbchenprobe nicht vergessen'
            },
            {
                stepNumber: 5,
                instruction: 'Für das Frosting Frischkäse mit Puderzucker verrühren und auf dem ausgekühlten Kuchen verteilen.'
            }
        ],
        nutritionalValues: {
            calories: 385,
            protein: 6,
            carbohydrates: 45,
            fat: 22
        },
        authors: [
            { name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }
        ],
        category: Category.BAKING,
        creationDate: new Date("2024-03-08")
    },
    {
        img: 'https://picsum.photos/800/450?random=4',
        tag: 'Grillen',
        title: 'BBQ Rippchen mit Honig-Glasur',
        shortDescription: 'Zarte Rippchen mit süß-würziger Honig-BBQ-Glasur',
        preparationTime: 30,
        cookingTime: 180,
        difficulty: 'Schwer',
        servings: 4,
        ingredients: [
            { name: 'Spareribs', amount: 2, unit: 'kg' },
            { name: 'BBQ Sauce', amount: 400, unit: 'ml' },
            { name: 'Honig', amount: 100, unit: 'ml' },
            { name: 'Knoblauch', amount: 4, unit: 'Zehen' },
            { name: 'BBQ Rub', amount: 4, unit: 'EL' }
        ],
        steps: [
            {
                stepNumber: 1,
                instruction: 'Silberhaut von den Rippchen entfernen und mit BBQ Rub einreiben.',
                tip: 'Am besten über Nacht marinieren'
            },
            {
                stepNumber: 2,
                instruction: 'Grill auf 110°C indirekte Hitze vorbereiten.'
            },
            {
                stepNumber: 3,
                instruction: 'Rippchen für 3 Stunden räuchern.',
                tip: 'Kirschholz gibt ein besonders gutes Aroma'
            },
            {
                stepNumber: 4,
                instruction: 'Honig-BBQ-Sauce mischen und Rippchen damit alle 30 Minuten bestreichen.'
            },
            {
                stepNumber: 5,
                instruction: 'In der letzten halben Stunde die Temperatur erhöhen und karamellisieren lassen.'
            }
        ],
        nutritionalValues: {
            calories: 850,
            protein: 45,
            carbohydrates: 35,
            fat: 60
        },
        authors: [
            { name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' }
        ],
        category: Category.BARBEQUE,
        creationDate: new Date("2024-03-05")
    },
    {
        img: 'https://picsum.photos/800/450?random=5',
        tag: 'Backen',
        title: 'Französische Macarons',
        shortDescription: 'Klassische französische Macarons mit Vanille-Ganache',
        preparationTime: 45,
        cookingTime: 15,
        difficulty: 'Schwer',
        servings: 24,
        ingredients: [
            { name: 'Mandelnmehl', amount: 200, unit: 'g' },
            { name: 'Puderzucker', amount: 200, unit: 'g' },
            { name: 'Eiweiß', amount: 3, unit: 'Stück' },
            { name: 'Zucker', amount: 50, unit: 'g' },
            { name: 'Sahne', amount: 200, unit: 'ml' },
            { name: 'Weiße Schokolade', amount: 200, unit: 'g' },
            { name: 'Vanilleschote', amount: 1, unit: 'Stück' }
        ],
        steps: [
            {
                stepNumber: 1,
                instruction: 'Mandelnmehl und Puderzucker sieben und mischen.',
                tip: 'Zweimal sieben für extra feine Macarons'
            },
            {
                stepNumber: 2,
                instruction: 'Eiweiß steif schlagen, nach und nach Zucker einrieseln lassen.'
            },
            {
                stepNumber: 3,
                instruction: 'Mandel-Zucker-Mischung vorsichtig unterheben.',
                tip: 'Nicht mehr als 50 Mal rühren'
            },
            {
                stepNumber: 4,
                instruction: 'Masse in Spritzbeutel füllen und kleine Kreise spritzen.'
            },
            {
                stepNumber: 5,
                instruction: 'Bei 150°C für 15 Minuten backen, mit Vanille-Ganache füllen.'
            }
        ],
        nutritionalValues: {
            calories: 180,
            protein: 4,
            carbohydrates: 25,
            fat: 8
        },
        authors: [
            { name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }
        ],
        category: Category.BAKING,
        creationDate: new Date("2024-03-01")
    },
    {
        img: 'https://picsum.photos/800/450?random=6',
        tag: 'Grillen',
        title: 'Gegrillter Gemüse-Halloumi Spieß',
        shortDescription: 'Bunte Gemüsespieße mit würzigem Halloumi-Käse',
        preparationTime: 20,
        cookingTime: 10,
        difficulty: 'Einfach',
        servings: 4,
        ingredients: [
            { name: 'Halloumi', amount: 400, unit: 'g' },
            { name: 'Zucchini', amount: 2, unit: 'Stück' },
            { name: 'Paprika', amount: 2, unit: 'Stück' },
            { name: 'Champignons', amount: 250, unit: 'g' },
            { name: 'Olivenöl', amount: 4, unit: 'EL' },
            { name: 'Oregano', amount: 2, unit: 'TL' },
            { name: 'Holzspieße', amount: 8, unit: 'Stück' }
        ],
        steps: [
            {
                stepNumber: 1,
                instruction: 'Holzspieße in Wasser einweichen.',
                tip: 'Mindestens 30 Minuten einweichen damit sie nicht verbrennen'
            },
            {
                stepNumber: 2,
                instruction: 'Gemüse und Halloumi in gleichmäßige Stücke schneiden.'
            },
            {
                stepNumber: 3,
                instruction: 'Marinade aus Olivenöl und Kräutern zubereiten.'
            },
            {
                stepNumber: 4,
                instruction: 'Gemüse und Käse abwechselnd aufspießen und mit Marinade bestreichen.'
            },
            {
                stepNumber: 5,
                instruction: 'Spieße bei mittlerer Hitze von allen Seiten grillen bis das Gemüse gar ist.'
            }
        ],
        nutritionalValues: {
            calories: 320,
            protein: 18,
            carbohydrates: 8,
            fat: 25
        },
        authors: [
            { name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' }
        ],
        category: Category.BARBEQUE,
        creationDate: new Date("2024-02-28")
    }
];

const StyledCard = styled(Card)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    height: '100%',
    backgroundColor: (theme.vars || theme).palette.background.paper,
    '&:hover': {
        backgroundColor: 'transparent',
        cursor: 'pointer',
    },
    '&:focus-visible': {
        outline: '3px solid',
        outlineColor: 'hsla(210, 98%, 48%, 0.5)',
        outlineOffset: '2px',
    },
}));

const StyledCardContent = styled(CardContent)({
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 16,
    flexGrow: 1,
    '&:last-child': {
        paddingBottom: 16,
    },
});

const StyledTypography = styled(Typography)({
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

function Author({ authors, creationDate }: { authors: { name: string; avatar: string }[], creationDate: Date }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
            }}
        >
            <Box
                sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}
            >
                <AvatarGroup max={3}>
                    {authors.map((author, index) => (
                        <Avatar
                            key={index}
                            alt={author.name}
                            src={author.avatar}
                            sx={{ width: 24, height: 24 }}
                        />
                    ))}
                </AvatarGroup>
                <Typography variant="caption">
                    {authors.map((author) => author.name).join(', ')}
                </Typography>
            </Box>
            <Typography variant="caption">{`${creationDate.getDate()}.${creationDate.getMonth()}.${creationDate.getFullYear()}`}</Typography>
        </Box>
    );
}

const onSearch = (event: React.ChangeEvent<HTMLInputElement  | HTMLTextAreaElement>, chips: Card[], setFilteredChips: (value: Card[] | ((prevState: Card[]) => Card[])) => void) => {
    setFilteredChips(chips.filter((chip) => chip.title.toLowerCase().includes(event.target.value.toLowerCase())));
}

export function Search(chips: Card[], setFilteredChips: (value: Card[] | ((prevState: Card[]) => Card[])) => void) {
    return (
        <FormControl sx={{ width: { xs: '100%', md: '25ch' } }} variant="outlined">
            <OutlinedInput
                size="small"
                id="search"
                placeholder="Suchen…"
                sx={{ flexGrow: 1 }}
                startAdornment={
                    <InputAdornment position="start" sx={{ color: 'text.primary' }}>
                        <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                }
                inputProps={{
                    'aria-label': 'search',
                }}
                onChange={(event) => onSearch(event, chips, setFilteredChips)}
            />
        </FormControl>
    );
}

export default function MainContent() {
    const [focusedCardIndex, setFocusedCardIndex] = React.useState<number | null>(
        null,
    );
    // TODO Filter in Kombination mit Suchfeld funktioniert noch nicht komplett
    const [categorizedChips, setCategorizedChips] = useState<Card[]>(cardData)
    const [filteredChips, setFilteredChips] = useState<Card[]>(categorizedChips)
    const [checkedCategory, setCheckedCategory] = React.useState<Category>(Category.ALLCATEGORIES);

    const handleFocus = (index: number) => {
        setFocusedCardIndex(index);
    };

    const handleBlur = () => {
        setFocusedCardIndex(null);
    };

    const handleClick = (category: Category) => {
        setCategorizedChips(cardData.filter((card => card.category === category)))
        setFilteredChips(cardData.filter((card => card.category === category)))
        setCheckedCategory(category)
    };

    const resetCards = () => {
        setCategorizedChips(cardData)
        setFilteredChips(cardData)
        setCheckedCategory(Category.ALLCATEGORIES)
    };

    const [selectedRecipe, setSelectedRecipe] = useState<Card | null>(null);

    const showRecipeDetails = (index: number) => {
        setSelectedRecipe(filteredChips[index]);
    };


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>
                <Typography variant="h1" gutterBottom>
                    Rezepte
                </Typography>
                <Typography>Hier gibt es bald richtig viele Rezepte</Typography>
            </div>
            <Box
                sx={{
                    display: { xs: 'flex', sm: 'none' },
                    flexDirection: 'row',
                    gap: 1,
                    width: { xs: '100%', md: 'fit-content' },
                    overflow: 'auto',
                }}
            >
                {Search(categorizedChips, setFilteredChips)}
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column-reverse', md: 'row' },
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'start', md: 'center' },
                    gap: 4,
                    overflow: 'auto',
                }}
            >
                <Box
                    sx={{
                        display: 'inline-flex',
                        flexDirection: 'row',
                        gap: 3,
                        overflow: 'auto',
                    }}
                >
                    <Chip onClick={resetCards} size="medium" label="Alle Kategorien"
                          sx={{
                              backgroundColor: checkedCategory === Category.ALLCATEGORIES ? 'hsl(220, 30%, 6%)' : 'transparent',
                              border:  checkedCategory === Category.ALLCATEGORIES ?  'solid 1px': 'none',
                          }}
                    />
                    <Chip
                        onClick={() => handleClick(Category.BAKING)}
                        size="medium"
                        label="Backen"
                        sx={{
                            backgroundColor: checkedCategory === Category.BAKING ? 'hsl(220, 30%, 6%)' : 'transparent',
                            border:  checkedCategory === Category.BAKING ?  'solid 1px': 'none',
                        }}
                    />
                    <Chip
                        onClick={() => handleClick(Category.BARBEQUE)}
                        size="medium"
                        label="Grillen"
                        sx={{
                            backgroundColor: checkedCategory === Category.BARBEQUE ? 'hsl(220, 30%, 6%)' : 'transparent',
                            border:  checkedCategory === Category.BARBEQUE ?  'solid 1px': 'none',
                        }}
                    />
                    <Chip
                        onClick={() => handleClick(Category.COOKING)}
                        size="medium"
                        label="Kochen"
                        sx={{
                            backgroundColor: checkedCategory === Category.COOKING ? 'hsl(220, 30%, 6%)' : 'transparent',
                            border:  checkedCategory === Category.COOKING ?  'solid 1px': 'none',
                        }}
                    />
                </Box>
                <Box
                    sx={{
                        display: { xs: 'none', sm: 'flex' },
                        flexDirection: 'row',
                        gap: 1,
                        width: { xs: '100%', md: 'fit-content' },
                        overflow: 'auto',
                    }}
                >
                    {Search(categorizedChips, setFilteredChips)}
                </Box>
            </Box>
            <Grid container spacing={2} columns={12}>
                {filteredChips.map((card, index) => (
                    <Grid size={{ xs: 12, md: 6 }} key={"card" + index}>
                        <StyledCard
                            variant="outlined"
                            onFocus={() => handleFocus(index)}
                            onBlur={handleBlur}
                            tabIndex={0}
                            className={focusedCardIndex === index ? 'Mui-focused' : ''}
                            onClick={() => showRecipeDetails(index)}
                        >
                            <CardMedia
                                component="img"
                                alt="green iguana"
                                image={card.img}
                                sx={{
                                    aspectRatio: '16 / 9',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                }}
                            />
                            <StyledCardContent>
                                <Typography gutterBottom variant="caption" component="div">
                                    {card.tag}
                                </Typography>
                                <Typography gutterBottom variant="h6" component="div">
                                    {card.title}
                                </Typography>
                                <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                                    {card.shortDescription}
                                </StyledTypography>
                            </StyledCardContent>
                            <Author authors={card.authors} creationDate={card.creationDate} />
                        </StyledCard>
                    </Grid>
                ))}
            </Grid>{selectedRecipe && (
            <RecipeDetailView
                recipe={selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
            />
        )}

        </Box>
    );
}