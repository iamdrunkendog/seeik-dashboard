import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';
import SalesSummary from './SalesSummary';
import Transaction from './Transaction';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const BRAND_COLOR = '#FF7300';

  return (
    <Router>
      <Navbar variant="dark" expand="lg" style={{ backgroundColor: BRAND_COLOR }}>
        <Container>
          <Navbar.Brand as={NavLink} to="/">
            <img
              src="/logo.svg"
              height="30"
              className="d-inline-block align-top"
              alt="SEEIK-KIOSK Logo"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/" className="nav-item-custom">매출요약</Nav.Link>
              <Nav.Link as={NavLink} to="/transactions" className="nav-item-custom">트랜잭션</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Routes>
        <Route path="/" element={<SalesSummary />} />
        <Route path="/transactions" element={<Transaction />} />
      </Routes>
    </Router>
  );
}

export default App;