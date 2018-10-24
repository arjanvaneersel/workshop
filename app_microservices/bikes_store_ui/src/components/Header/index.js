import React from 'react';
import styled from 'styled-components';
import { lighten } from 'polished';
import { Link } from 'react-router-dom';


const Wrapper = styled.div`
  position: fixed;
  width: 70%;
  background: #dc251e;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,0.12);
  display: flex;
  justify-content: space-between;
  padding: 20px;
  z-index: 2;
`;

const Logotype = styled.div`
  font-weight: bold;
  text-transform: uppercase;
  color: white;
`;

const Nav = styled.div`
  a {
    background: black;
    font-weight: bold;
    color: white;
    text-decoration: none;
    padding: 10px 15px;
    margin-left: 10px;
    font-size: 14px;
    
    :hover {
      background: ${lighten('0.13', '#000')}
    }
  }
  
  a.admin {
    background: #feb2b3;
    
    :hover {
      background: ${lighten('0.03', '#feb2b3')}
    }
  }
`;

/**
 * Application header
 * @return {*}
 * @constructor
 */
const Header = () => (
  <Wrapper>
    <Logotype>Bikes store</Logotype>
    <Nav>
      <Link to="/">Catalog</Link>
      <Link to="/claim">Claim</Link>
      <Link className="admin" to="/dashboard">Admin dashboard</Link>
    </Nav>
  </Wrapper>
);

export default Header;
