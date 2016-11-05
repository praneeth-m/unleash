'use strict';

const logger = require('../logger');
const eventType = require('../event-type');
const ValidationError = require('../error/validation-error');
const validateRequest = require('../error/validate-request');

module.exports = function (app, config) {
    const featureToggleStore = config.featureToggleStore;
    const eventStore = config.eventStore;

    app.get('/archive/features', (req, res) => {
        featureToggleStore.getArchivedFeatures().then(archivedFeatures => {
            res.json({ features: archivedFeatures });
        });
    });

    app.post('/archive/revive', (req, res) => {
        req.checkBody('name', 'Name is required').notEmpty();

        validateRequest(req)
            .then(() => eventStore.store({
                type: eventType.featureRevived,
                createdBy: req.connection.remoteAddress,
                data: req.body,
            }))
            .then(() => res.status(200).end())
            .catch(ValidationError, () => res.status(400).json(req.validationErrors()))
            .catch(err => {
                logger.error('Could not revive feature toggle', err);
                res.status(500).end();
            });
    });
};
