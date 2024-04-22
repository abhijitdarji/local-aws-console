
const getDateTimeFromQuery = (query: any) => {

    if (!query) {
        return null;
    }

    const isDate = !isNaN(Date.parse(query));

    if (isDate) {
        return new Date(query);
    }

    const humanTimeAgoRegex = /(\d+)(m|h|d|w) ago/g;

    const match = humanTimeAgoRegex.exec(query);

    if (match?.length) {
        const amount = parseInt(match[1]);
        const unit = match[2];

        const now = new Date();

        switch (unit) {
            case 'm':
                now.setMinutes(now.getMinutes() - amount);
                break;
            case 'h':
                now.setHours(now.getHours() - amount);
                break;
            case 'd':
                now.setDate(now.getDate() - amount);
                break;
            case 'w':
                now.setDate(now.getDate() - (amount * 7));
                break;
            default:
                break;
        }

        return now;
    }
    else {
        return null;
    }

}


export { getDateTimeFromQuery };