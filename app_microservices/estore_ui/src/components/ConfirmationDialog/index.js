import React, { Component } from 'react';
import {
  Pane, Dialog, Button, TextInput,
} from 'evergreen-ui';


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
          confirmLabel={this.state.isLoading ? 'Loading...' : this.props.label}
        >
          <p>Are you sure you want to confirm this transaction?</p>

          {this.props.withDetails && (
            <div>
              <p>If so, please specify the details:</p>
              <TextInput
                placeholder="Details"
                width="100%"
                fontSize="14px"
                onChange={e => this.setState({ details: e.target.value })}
                value={this.state.details}
              />
            </div>
          )}
        </Dialog>

        <Button
          onClick={() => this.setState({isShown: true})}
          marginRight={16}
          appearance="primary"
          height={32}
          intent={this.props.intent}
        >
          {this.props.label}
        </Button>
      </Pane>
    );
  }
}

export default ConfirmationDialog;
