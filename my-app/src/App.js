import React from 'react';
import './App.css';
import Barchart from "./barchart";
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

function App() {
    return (
        <ErrorBoundary>
            <div className="App">
                <Barchart></Barchart>
            </div>
        </ErrorBoundary>
    );
}

export default App;
