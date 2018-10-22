import React from 'react';
import styled from 'styled-components';


const Wrapper = styled.div`
  width: 30%;
  background: #113754;
  height: 100%;
  color: #fff;
  z-index: 1;
  position: fixed;
  right: 0;
`;

const Title = styled.div`
  position: fixed;
  width: 100%;
  background: #113754;
  border-bottom: 1px solid #2e6498;
  padding: 20px;
  z-index: 1000;
`;

const List = styled.div`
  overflow-y: scroll;
  height: 100%;
  padding-top: 60px;
`;

const Message = styled.div`
  background: #415e78;
  padding: 12px;
  margin: 10px 10px;
`;

const Console = ({logs}) => (
  <Wrapper>
    <Title>Console</Title>

    <List>
      {logs.map((log, i) => (
        <Message key={i}>
          {log}
        </Message>
      ))}
    </List>
  </Wrapper>
);

export default Console;
