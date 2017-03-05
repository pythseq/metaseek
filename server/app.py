# Webapp framework
from flask import Flask

# Database setup and ORM
from flask_sqlalchemy import SQLAlchemy

# Support for REST API in Flask
from flask_restful import Resource, Api, reqparse, fields, marshal_with

# Utilities
from datetime import datetime
import random
import json

# Config / initialize the app, database and api
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/metaseek'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
api = Api(app)

# Declare Models - Dataset, User, Discovery
# each class becomes a table
class Dataset(db.Model):
    # each attribute on a "Model" inherited class becomes a Column
    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    URL = db.Column(db.Text)
    date = db.Column(db.DateTime)
    # full = db.Column(db.PickleType)

    # Each class must have an init function
    def __init__(self, latitude, longitude, URL, date):
        self.latitude = latitude
        self.longitude = longitude
        self.date = date
        self.URL = URL

    # Friendly string representation
    def __repr__(self):
        return '<Dataset %r>' % self.URL

# For a many to many database relationship, use a mapping table (no class definition directly)
# Eg. each discovery will have many datasets, and each dataset may belong to many discoveries
# Each row in this table is one "dataset in discovery" membership
dataset_to_discovery = db.Table('dataset_to_discovery',
    db.Column('dataset_id', db.Integer, db.ForeignKey('dataset.id')),
    db.Column('discovery_id', db.Integer, db.ForeignKey('discovery.id'))
)

class Discovery(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    filter_params = db.Column(db.String(40))
    timestamp = db.Column(db.DateTime)
    datasets = db.relationship('Dataset', secondary=dataset_to_discovery, backref=db.backref('discoveries', lazy='dynamic'))

    def __init__(self, owner_id, filter_params, datasets, timestamp=None, ):
        self.owner_id = owner_id
        self.filter_params = filter_params
        self.datasets = datasets
        if timestamp is None:
            timestamp = datetime.utcnow()
        self.timestamp = timestamp

    def __repr__(self):
        return '<Discovery %r>' % self.filter_params

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    firebase_id = db.Column(db.String(28), unique=True)
    admin = db.Column(db.Boolean)
    discoveries = db.relationship('Discovery', backref='user', lazy='dynamic')

    def __init__(self, firebase_id, admin=False):
        self.firebase_id = firebase_id
        self.admin = admin

    def __repr__(self):
        return '<User %r>' % self.firebase_id

# TODO take this out into a 'bootstrap.py' file for kickstarting a new DB
db.create_all()

# End Model definitions and create any new tables in the DB

# Declare route functions

class CreateUser(Resource):
    def post(self):
        try:
            parser = reqparse.RequestParser()

            parser.add_argument('firebase_id', type=str, help='Email address to create user')
            parser.add_argument('admin', type=int)

            args = parser.parse_args()
            print args

            existingUser = User.query.filter_by(firebase_id=args['firebase_id']).first()

            if (existingUser):
                return {'error':'User already exists!','uri':'http://127.0.0.1:5000/api/user/' + str(existingUser.id)}
            else:
                newUser = User(args['firebase_id'],args['admin'])
                db.session.add(newUser)
                db.session.commit()
                return {'firebase_id': args['firebase_id'], 'admin': args['admin'], 'id': newUser.id}

        except Exception as e:
            return {'error': str(e)}

class GetUser(Resource):
    def get(self, user_id):
        existingUser = User.query.get(user_id)
        return {'firebase_id': existingUser.firebase_id, 'admin': existingUser.admin, 'id': existingUser.id}

api.add_resource(CreateUser, '/api/user/create')
api.add_resource(GetUser, '/api/user/<int:user_id>')

# End route functions
# Declare routing
# Start the app!
if __name__ == '__main__':
    app.run(debug=True)
