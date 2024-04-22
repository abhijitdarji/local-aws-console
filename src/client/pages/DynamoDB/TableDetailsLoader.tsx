import { useLoaderData, useLocation, useParams } from "react-router-dom";
import { DdbTableItems } from "./DdbTableItems";
import { DdbTableDetails } from "./DdbTableDetails";

export const TableDetailsLoader = () => {
    const { tableName } = useParams();
    const data = useLoaderData();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const page = queryParams.get('page');

    if (page === 'query') {
        return <DdbTableItems tableName={tableName || ''} tableDetails={data} />;
    } else {
        return <DdbTableDetails tableName={tableName || ''} tableDetails={data} />;
    }
};