jest.mock('react-navigation-drawer', () => {
    return {
        createDrawerNavigator: jest.fn().mockImplementation((nav) => {
            return {};
        }),
    };
});
