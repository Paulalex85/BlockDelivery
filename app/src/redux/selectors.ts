export const getUserState = (store: { user: any; }) => store.user;

export const getUserAddress = (store: any) =>
    getUserState(store) ? getUserState(store).address : "";