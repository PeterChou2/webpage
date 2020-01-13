import React, { Component } from 'react'
import './App.css';
import Dashboard from "./barchart";
import financial from "./test";
import PlaidLink from 'react-plaid-link'

//Error Boundary component to catch child errors
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.log(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div>
                        <h1>Something went wrong Ops</h1>
                        {this.props.children}
                   </div>;
        }

        return this.props.children;
    }
}

class App extends Component {
    handleOnSuccess(token, metadata) {
        // send token to client server
        console.log(token);
        console.log(metadata);
        return (<h1>Hello World</h1>)
    }

    handleOnExit() {
        // handle the case when your user exits Link
    }

    render() {
        return (
            <ErrorBoundary>
                <div className="App">
                    <PlaidLink
                        clientName="Plaid Connect"
                        env="sandbox"
                        product={["auth", "transactions"]}
                        publicKey="9fdb3bbc4f7a7112665464fd637fab"
                        onExit={this.handleOnExit}
                        onSuccess={this.handleOnSuccess}>
                        Open Link and connect your bank!
                    </PlaidLink>
                </div>
            </ErrorBoundary>
        );
    }
}

export default App;
