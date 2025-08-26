import React from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Distributor from './pages/Distributor';
import NewDistributor from './pages/NewDistributor';
import Shop from './pages/Shop';
import Chat from './pages/Chat';
import Mechanic from './pages/Mechanic';
import About from './pages/About';
import { CartProvider } from './context/CartContext';
import theme from './theme';

function App() {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <CartProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/distributor" element={<Distributor />} />
                <Route path="/new-distributor" element={<NewDistributor />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/mechanics" element={<Mechanic />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Layout>
          </Router>
        </CartProvider>
      </ChakraProvider>
    </>
  );
}

export default App;
