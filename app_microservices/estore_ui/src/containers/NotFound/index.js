import React, { Component } from 'react';
import { Helmet } from 'react-helmet';


class NotFound extends Component {
  render() {
    return (
      <article>
        <Helmet>
          <title>Not found</title>
        </Helmet>
        <h1>Page not found</h1>
      </article>
    );
  }
}

export default NotFound;
