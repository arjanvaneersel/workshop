import React, { Component } from 'react';
import { Pane, Dialog, Button, TextInput } from 'evergreen-ui';


class ConfirmationDialog extends Component {
  state = {
    isShown: false,
    isLoading: false,
    details: '',
  };

  confirm = () => {
    this.setState({isLoading: true});

    this.props.request(this.props.action, {
      id: this.props.id,
      details: this.state.details,
    })
      .then(({data}) => {
        this.setState({isShown: false});
        this.props.updateAfterTransaction(data);
      })
      .catch(console.error);
  }

  render() {
    return (
      <Pane>
        <Dialog
          isShown={this.state.isShown}
          title="Transaction confirmation"
          onCloseComplete={() => this.setState({isShown: false, isLoading: false})}
          isConfirmLoading={this.state.isLoading}
          onConfirm={this.confirm}
          confirmLabel={this.state.isLoading ? 'Loading...' : 'Send transaction'}
        >
          <p>Think twice before you confirm transaction</p>

          {this.props.withDetails && (
            <TextInput
              placeholder="Specify details"
              width="100%"
              onChange={e => this.setState({ details: e.target.value })}
              value={this.state.details}
            />
          )}
        </Dialog>

        <Button
          onClick={() => this.setState({isShown: true})}
          marginRight={16}
          appearance="primary"
          intent={this.props.intent}
        >
          {this.props.action.toUpperCase()}
        </Button>
      </Pane>
    );
  }
}

export default ConfirmationDialog;
