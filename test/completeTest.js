const Promise = require('bluebird');
const assert = require('chai').assert;
const helper = require('./testHelper');

describe('complete', function() {

  let boss;

  before(function(finished){
    helper.start()
      .then(dabauce => {
        boss = dabauce;
        finished();
      });
  });

  after(function(finished) {
    boss.stop().then(() => finished());
  });

  it('should reject missing id argument', function(finished){
    boss.complete().catch(() => finished());
  });

  it('should complete a batch of jobs', function(finished){
    const jobName = 'complete-batch';

    Promise.all([
      boss.publish(jobName),
      boss.publish(jobName),
      boss.publish(jobName)
    ])
    .then(() => boss.fetch(jobName, 3))
    .then(jobs => boss.complete(jobs.map(job => job.id)))
    .then(() => finished());

  });

  it('should subscribe to the response on a complete call', function(finished){

    const jobName = 'part-of-something-important';
    const responsePayload = {message: 'super-important-payload', arg2: '123'};

    let jobId = null;

    boss.onComplete(jobName, job => {
      assert.equal(jobId, job.data.request.id);
      assert.equal(job.data.response.message, responsePayload.message);
      assert.equal(job.data.response.arg2, responsePayload.arg2);

      finished();
    });

    boss.publish(jobName)
      .then(id => jobId = id)
      .then(() => boss.fetch(jobName))
      .then(job => boss.complete(job.id, responsePayload));

  });

});