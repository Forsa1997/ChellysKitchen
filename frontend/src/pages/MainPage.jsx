import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import withRoot from '../modules/withRoot';
import { useNavigate } from 'react-router-dom';
import FileUploadSingle from '../modules/components/FileUploadSingle';


const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const MainPage = () => {

    const navigate = useNavigate();

    return (
        <>
            <CssBaseline />
            <Box
                sx={{
                    bgcolor: 'background.paper',
                    pt: 8,
                    pb: 6,
                }}
            >
                <Container maxWidth="sm">
                    <Typography
                        component="h1"
                        variant="h2"
                        align="center"
                        color="text.primary"
                        gutterBottom
                    >
                        Recipes
                    </Typography>
                    <Typography variant="h5" align="center" color="text.secondary" paragraph>
                        Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                        sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
                        At vero eos et accusam et justo duo dolores et ea rebum.
                    </Typography>
                    <Stack
                        sx={{ pt: 4 }}
                        direction="row"
                        spacing={2}
                        justifyContent="center"
                    >
                        <Button variant="contained" onClick={() => navigate("/recipe/create")}>Create Recipe</Button>
                        <Button variant="outlined">Secondary action</Button>
                    </Stack>
                </Container>
            </Box>
            <Container sx={{ py: 8 }}>
                <Grid container spacing={4} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {false ?
                        <Box sx={{ display: "flex", justifyContent: "center", height: "400px", alignItems: "center" }}><CircularProgress size={100} /></Box> :
                        cards.map((card) => (
                            <Grid item key={card} xs={12} sm={6} md={4}>
                                <Card
                                    sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                >
                                    {false ?
                                        <Box sx={{ display: "flex", justifyContent: "center", height: "400px", alignItems: "center" }}><CircularProgress size={100} /></Box> :
                                        <>
                                            <CardMedia
                                                component="img"
                                                sx={{
                                                    // 16:9
                                                }}
                                                image="https://picsum.photos/900/600"
                                                alt="random"
                                            />
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Typography gutterBottom variant="h5" component="h2">
                                                    Recipe
                                                </Typography>
                                                <Typography>
                                                    Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                                                    sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
                                                    At vero eos et accusam et justo duo dolores et ea rebum.
                                                </Typography>
                                            </CardContent>
                                            <CardActions>
                                                <Button size="small">View</Button>
                                                <Button size="small">Edit</Button>
                                            </CardActions>
                                        </>}
                                </Card>
                            </Grid>
                        ))}
                </Grid>
            </Container>
        </>
    );

}

export default withRoot(MainPage);