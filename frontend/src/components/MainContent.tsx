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


enum Category {
    COOKING = "Cooking",
    BAKING = "Baking",
    BARBEQUE = "Barbeque",
    ALLCATEGORIES = "Allcategories",
}

const cardData = [
    {
        img: 'https://picsum.photos/800/450?random=1',
        tag: 'Kochen',
        title: 'Lorem ipsum dolor sit amet',
        description:
            'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ' +
            'At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, ' +
            'consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. ' +
            'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
        authors: [
            { name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' },
            { name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' },
        ],
        category: Category.COOKING,
        creationDate: new Date("2022-08-09"),
    },
    {
        img: 'https://picsum.photos/800/450?random=2',
        tag: 'Kochen',
        title: 'Lorem ipsum dolor sit amet',
        description:
            'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ' +
            'At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, ' +
            'consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. ' +
            'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
        authors: [       { name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' },],
        category: Category.COOKING,
        creationDate: new Date("2022-08-09"),
    },
    {
        img: 'https://picsum.photos/800/450?random=3',
        tag: 'Backen',
        title: 'Lorem ipsum dolor sit amet',
        description:
            'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ' +
            'At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, ' +
            'consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. ' +
            'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
        authors: [       { name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' },],
        category: Category.BAKING,
        creationDate: new Date("2022-08-09"),
    },

    {
        img: 'https://picsum.photos/800/450?random=4',
        tag: 'Grillen',
        title: 'Lorem ipsum dolor sit amet',
        description:
            'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ' +
            'At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, ' +
            'consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. ' +
            'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
        authors: [      { name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' },],
        category: Category.BARBEQUE,
        creationDate: new Date("2022-08-09"),
    },

    {
        img: 'https://picsum.photos/800/450?random=45',
        tag: 'Backen',
        title: 'Lorem ipsum dolor sit amet',
        description:
            'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ' +
            'At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, ' +
            'consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. ' +
            'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
        authors: [
            { name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' },
        ],
        category: Category.BAKING,
        creationDate: new Date("2022-08-09"),
    },
    {
        img: 'https://picsum.photos/800/450?random=6',
        tag: 'Grillen',
        title: 'Lorem ipsum dolor sit amet',
        description:
            'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ' +
            'At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, ' +
            'consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. ' +
            'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
        authors: [      { name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' },],
        category: Category.BARBEQUE,
        creationDate: new Date("2022-08-09"),
    },
];

const SyledCard = styled(Card)(({ theme }) => ({
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

const SyledCardContent = styled(CardContent)({
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

export function Search() {
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
            />
        </FormControl>
    );
}

export default function MainContent() {
    const [focusedCardIndex, setFocusedCardIndex] = React.useState<number | null>(
        null,
    );
    const [filteredChips, setFilteredChips] = useState(cardData)
    const [checkedCategory, setCheckedCategory] = React.useState<Category>(Category.ALLCATEGORIES);

    const handleFocus = (index: number) => {
        setFocusedCardIndex(index);
    };

    const handleBlur = () => {
        setFocusedCardIndex(null);
    };

    const handleClick = (category: Category) => {
        setFilteredChips(cardData.filter((card => card.category === category)))
        setCheckedCategory(category)
    };

    const resetCards = () => {
        setFilteredChips(cardData)
        setCheckedCategory(Category.ALLCATEGORIES)
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
                <Search />
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
                    <Search />
                </Box>
            </Box>
            <Grid container spacing={2} columns={12}>
                {filteredChips.map((card, index) => (
                    <Grid size={{ xs: 12, md: 6 }} key={"card" + index}>
                        <SyledCard
                            variant="outlined"
                            onFocus={() => handleFocus(0)}
                            onBlur={handleBlur}
                            tabIndex={0}
                            className={focusedCardIndex === 0 ? 'Mui-focused' : ''}
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
                            <SyledCardContent>
                                <Typography gutterBottom variant="caption" component="div">
                                    {card.tag}
                                </Typography>
                                <Typography gutterBottom variant="h6" component="div">
                                    {card.title}
                                </Typography>
                                <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                                    {card.description}
                                </StyledTypography>
                            </SyledCardContent>
                            <Author authors={card.authors} creationDate={card.creationDate} />
                        </SyledCard>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}